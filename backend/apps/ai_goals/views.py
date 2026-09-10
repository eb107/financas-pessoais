import anthropic
from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.ai_assistant.context import build_financial_context
from apps.ai_categorization.throttles import AICategorizationThrottle
from apps.ai_core.client import suggest_goal_plan
from apps.ai_core.prompts.goals import build_goal_suggestion_prompt
from apps.goals.models import Goal
from apps.goals.serializers import GoalSerializer


class GoalSuggestionView(APIView):
    """Sugere, via IA, como o usuário pode atingir uma meta no prazo.

    Os números (quanto falta, quanto precisa guardar por mês) já são
    calculados de forma determinística pelo GoalSerializer — a IA só entra
    pra narrar sugestões concretas em cima deles, usando o mesmo resumo
    financeiro agregado do chat.
    """

    permission_classes = [IsAuthenticated]
    throttle_classes = [AICategorizationThrottle]

    def post(self, request, goal_id):
        goal = get_object_or_404(Goal, id=goal_id, user=request.user)

        request.user.record_ai_consent()

        if not settings.ANTHROPIC_API_KEY:
            return Response(
                {
                    "detail": "Sugestões por IA não configuradas (falta "
                    "ANTHROPIC_API_KEY)."
                },
                status=200,
            )

        data = GoalSerializer(goal, context={"request": request}).data
        prompt = build_goal_suggestion_prompt(
            goal_name=goal.name,
            target_amount=float(goal.target_amount),
            target_date=goal.target_date.isoformat(),
            current_amount=float(data["current_amount"]),
            monthly_required=float(data["monthly_required"]),
            months_remaining=data["months_remaining"],
            financial_context=build_financial_context(request.user),
        )

        try:
            suggestion = suggest_goal_plan(prompt)
        except anthropic.APIError:
            return Response(
                {"detail": "Não consegui falar com a IA agora. Tente novamente."},
                status=200,
            )

        return Response({"suggestion": suggestion})
