from rest_framework.throttling import UserRateThrottle


class AICategorizationThrottle(UserRateThrottle):
    """Limite bem mais restritivo que o resto da API — protege contra custo
    inesperado de chamadas à API da Anthropic (taxa configurada em
    REST_FRAMEWORK.DEFAULT_THROTTLE_RATES, chave "ai")."""

    scope = "ai"
