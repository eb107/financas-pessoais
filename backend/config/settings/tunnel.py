"""Settings usadas só quando o app é exposto publicamente via túnel (ver
docker-compose.tunnel.yml) pra teste rápido — não é o mesmo que produção
de verdade (isso continua sendo o papel de settings/prod.py, pensado pra
um deploy real atrás de um proxy com domínio fixo).

Aqui a única mudança real é desligar o DEBUG (evita vazar stack trace e
caminho interno pra qualquer um que acessar o link público) e aceitar
qualquer host, já que a URL do túnel é aleatória a cada execução.
"""

from .base import *  # noqa: F403

DEBUG = False

# A URL do Cloudflare Tunnel muda a cada execução (plano gratuito, sem
# domínio fixo) — não dá pra saber o host de antemão pra restringir.
# Aceitável aqui por ser só pra teste rápido e temporário; um deploy real
# (settings/prod.py) deve sempre restringir ALLOWED_HOSTS de verdade.
ALLOWED_HOSTS = ["*"]
