from rest_framework.throttling import AnonRateThrottle


class AuthRateThrottle(AnonRateThrottle):
    """Limite por IP nos endpoints pré-autenticação (login/registro/refresh).

    Sem isto, login/registro não têm nenhum limite de tentativas — um
    atacante pode forçar senha por força bruta ou automatizar criação de
    contas sem restrição nenhuma. Taxa configurada em
    REST_FRAMEWORK.DEFAULT_THROTTLE_RATES, chave "auth".
    """

    scope = "auth"
