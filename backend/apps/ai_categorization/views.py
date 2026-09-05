import anthropic
from django.conf import settings
from django.db.models import Q
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.ai_core.client import categorize_transaction
from apps.categories.models import Category
from apps.transactions.models import Transaction

from .rules import categorize_by_rules
from .throttles import AICategorizationThrottle


class CategorizeTransactionView(APIView):
    """Sugere (e aplica) uma categoria para uma transação existente.

    Fluxo: tenta primeiro um match por palavra-chave (rules.py, sem custo);
    só recorre à API da Anthropic quando nenhuma regra bate. O resultado é
    salvo direto na transação (o usuário pode trocar depois normalmente,
    como qualquer outro campo).
    """

    permission_classes = [IsAuthenticated]
    throttle_classes = [AICategorizationThrottle]

    def post(self, request, transaction_id):
        try:
            transaction = Transaction.objects.get(
                id=transaction_id, wallet__user=request.user
            )
        except Transaction.DoesNotExist:
            return Response({"detail": "Transação não encontrada."}, status=404)

        rule_match = categorize_by_rules(transaction.description)
        if rule_match:
            category_name, source, confidence = rule_match, "rule", 1.0
        elif not settings.ANTHROPIC_API_KEY:
            return Response(
                {
                    "detail": "Categorização por IA não configurada (falta "
                    "ANTHROPIC_API_KEY).",
                    "source": None,
                },
                status=200,
            )
        else:
            category_names = list(
                Category.objects.filter(
                    Q(user=request.user) | Q(user__isnull=True),
                    kind=transaction.type,
                ).values_list("name", flat=True)
            )
            try:
                ai_match = categorize_transaction(
                    transaction.description, category_names
                )
            except anthropic.APIError:
                return Response(
                    {
                        "detail": "Falha ao consultar a IA. Tente novamente "
                        "mais tarde.",
                        "source": None,
                    },
                    status=200,
                )
            if not ai_match:
                return Response(
                    {
                        "detail": "Não foi possível sugerir uma categoria.",
                        "source": None,
                    },
                    status=200,
                )
            category_name, source, confidence = ai_match, "ai", 0.8

        category = Category.objects.filter(
            Q(user=request.user) | Q(user__isnull=True), name=category_name
        ).first()
        if not category:
            return Response(
                {"detail": "Categoria sugerida não existe.", "source": source},
                status=200,
            )

        transaction.category = category
        transaction.ai_category_confidence = confidence
        transaction.save(update_fields=["category", "ai_category_confidence"])

        return Response(
            {
                "category": category.id,
                "category_name": category.name,
                "confidence": confidence,
                "source": source,
            }
        )
