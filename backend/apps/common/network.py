from rest_framework.settings import api_settings


def get_client_ip(request) -> str:
    """Resolve o IP do cliente de forma consistente com `NUM_PROXIES`
    (config em REST_FRAMEWORK) — a mesma lógica que
    `rest_framework.throttling.SimpleRateThrottle.get_ident()` usa
    internamente, reaproveitada aqui pro `AdminLoginRateLimitMiddleware`
    (que não é uma view do DRF, então não ganha esse comportamento de
    graça).

    NUM_PROXIES=0 (padrão): ignora X-Forwarded-For por completo e usa
    REMOTE_ADDR direto — importante pra não confiar cegamente num header
    que qualquer cliente pode forjar na própria requisição, quando não
    existe de fato um proxy reverso confiável reescrevendo ele no meio do
    caminho. Só configure um valor maior que 0 se souber exatamente
    quantos proxies reais existem entre o cliente e o Django (cada um
    validando/reescrevendo o header, não só repassando o que veio).
    """
    remote_addr = request.META.get("REMOTE_ADDR", "unknown")
    num_proxies = api_settings.NUM_PROXIES or 0

    if num_proxies == 0:
        return remote_addr

    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if not xff:
        return remote_addr

    addrs = [addr.strip() for addr in xff.split(",")]
    return addrs[-min(num_proxies, len(addrs))]
