"""Monta um dump completo dos dados pessoais de um usuário — usado pelo
endpoint de portabilidade (LGPD Art. 18). Fica isolado num módulo próprio
(em vez de dentro de views.py) porque, diferente do resto do app accounts,
esta função precisa conhecer os models de praticamente todos os outros
apps — é uma preocupação transversal por natureza, não um detalhe de uma
view isolada.
"""


def build_user_data_export(user) -> dict:
    from apps.ai_assistant.models import ChatSession
    from apps.ai_assistant.serializers import (
        ChatMessageSerializer,
        ChatSessionSerializer,
    )
    from apps.ai_forecasting.models import ForecastResult
    from apps.ai_forecasting.serializers import ForecastResultSerializer
    from apps.ai_insights.models import Insight
    from apps.ai_insights.serializers import InsightSerializer
    from apps.budgets.models import Budget
    from apps.budgets.serializers import BudgetSerializer
    from apps.categories.models import Category, Tag
    from apps.categories.serializers import CategorySerializer, TagSerializer
    from apps.transactions.models import Transaction
    from apps.transactions.serializers import TransactionSerializer
    from apps.wallets.models import Wallet
    from apps.wallets.serializers import WalletSerializer

    wallets = Wallet.objects.filter(user=user)
    categories = Category.objects.filter(user=user)
    tags = Tag.objects.filter(user=user)
    transactions = Transaction.objects.filter(wallet__user=user)
    budgets = Budget.objects.filter(user=user)
    forecasts = ForecastResult.objects.filter(user=user)
    insights = Insight.objects.filter(user=user)
    chat_sessions = ChatSession.objects.filter(user=user).prefetch_related("messages")

    return {
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "date_joined": user.date_joined,
        },
        "wallets": WalletSerializer(wallets, many=True).data,
        "categories": CategorySerializer(categories, many=True).data,
        "tags": TagSerializer(tags, many=True).data,
        "transactions": TransactionSerializer(transactions, many=True).data,
        "budgets": BudgetSerializer(budgets, many=True).data,
        "forecasts": ForecastResultSerializer(forecasts, many=True).data,
        "insights": InsightSerializer(insights, many=True).data,
        "chat_sessions": [
            {
                **ChatSessionSerializer(session).data,
                "messages": ChatMessageSerializer(
                    session.messages.all(), many=True
                ).data,
            }
            for session in chat_sessions
        ],
    }
