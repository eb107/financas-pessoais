from .base import *  # noqa: F403

DEBUG = False
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS", default=[])

# HTTPS / cookies seguros — assume um proxy reverso (Nginx, Caddy, ou a
# própria plataforma de deploy) terminando TLS na frente do Django e
# repassando o protocolo original via X-Forwarded-Proto (padrão de mercado;
# sem isso o Django não tem como saber que a requisição chegou por HTTPS).
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_CONTENT_TYPE_NOSNIFF = True

# Não manda a URL completa (que pode ter dado sensível numa query string)
# como referrer pra sites de fora quando o usuário clica num link externo.
SECURE_REFERRER_POLICY = "same-origin"

# Isola a janela/aba do nosso site de outras abas de origens diferentes,
# mitigando uma classe de ataques (Spectre-like side-channels e alguns
# tipos de popup/tabnabbing) que dependem de duas origens compartilharem
# o mesmo processo de navegador.
SECURE_CROSS_ORIGIN_OPENER_POLICY = "same-origin"

# HSTS: começa curto (1 dia) de propósito — só aumentar para semanas/meses
# depois de confirmar que HTTPS funciona em todos os subdomínios/rotas.
# Um HSTS longo configurado errado "tranca" os usuários fora do site até
# o cabeçalho expirar no navegador deles.
SECURE_HSTS_SECONDS = 60 * 60 * 24
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
