from django.core.cache import cache
from django.http import HttpResponse

ADMIN_LOGIN_PATH = "/admin/login/"
RATE_LIMIT = 5
RATE_WINDOW_SECONDS = 60


class AdminLoginRateLimitMiddleware:
    """Limita tentativas de login no Django Admin por IP.

    O admin usa autenticação própria do Django (sessão/cookie), fora do
    alcance do AuthRateThrottle do DRF (que só cobre as views da nossa
    API — login, registro, refresh). Sem isto, o formulário de login do
    admin não tinha nenhum limite de tentativas, permitindo força bruta
    ilimitada contra a conta do superusuário.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method == "POST" and request.path == ADMIN_LOGIN_PATH:
            ip = request.META.get("REMOTE_ADDR", "unknown")
            cache_key = f"admin-login-throttle:{ip}"
            attempts = cache.get(cache_key, 0)
            if attempts >= RATE_LIMIT:
                return HttpResponse(
                    "Muitas tentativas de login. Tente novamente em alguns minutos.",
                    status=429,
                )
            cache.set(cache_key, attempts + 1, RATE_WINDOW_SECONDS)

        return self.get_response(request)
