from rest_framework.throttling import UserRateThrottle


class AIChatThrottle(UserRateThrottle):
    """Limite próprio pro chat — separado do throttle de categorização, já
    que uma conversa naturalmente envolve mais chamadas do que categorizar
    transações pontuais (taxa em REST_FRAMEWORK.DEFAULT_THROTTLE_RATES,
    chave "ai_chat")."""

    scope = "ai_chat"
