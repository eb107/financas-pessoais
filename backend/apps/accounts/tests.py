import pytest
from django.core.cache import cache

pytestmark = pytest.mark.django_db


@pytest.fixture(autouse=True)
def _clear_throttle_cache():
    """DRF guarda o contador de throttle no cache do Django, que persiste
    entre testes (não é resetado pelo rollback de transação do banco) —
    sem isto, um teste de throttle "vazaria" contagem pro próximo."""
    cache.clear()
    yield


def test_register_creates_user_with_hashed_password(api_client):
    response = api_client.post(
        "/api/auth/register/",
        {
            "username": "carol",
            "email": "carol@example.com",
            "password": "s3nhaSegura!23",
        },
    )

    assert response.status_code == 201
    assert "password" not in response.data

    from apps.accounts.models import User

    created = User.objects.get(username="carol")
    assert created.password != "s3nhaSegura!23"
    assert created.check_password("s3nhaSegura!23")


def test_register_rejects_weak_password(api_client):
    response = api_client.post(
        "/api/auth/register/",
        {"username": "carol", "email": "carol@example.com", "password": "123"},
    )
    assert response.status_code == 400


def test_login_returns_access_and_refresh_tokens(api_client, user):
    response = api_client.post(
        "/api/auth/token/",
        {"username": user.username, "password": "s3nhaSegura!23"},
    )
    assert response.status_code == 200
    assert "access" in response.data
    assert "refresh" in response.data


def test_login_rejects_wrong_password(api_client, user):
    response = api_client.post(
        "/api/auth/token/",
        {"username": user.username, "password": "senha-errada"},
    )
    assert response.status_code == 401


def test_me_requires_authentication(api_client):
    response = api_client.get("/api/auth/me/")
    assert response.status_code == 401


def test_me_returns_current_user_via_real_jwt_token(api_client, user):
    login = api_client.post(
        "/api/auth/token/",
        {"username": user.username, "password": "s3nhaSegura!23"},
    )
    access_token = login.data["access"]

    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
    response = api_client.get("/api/auth/me/")

    assert response.status_code == 200
    assert response.data["username"] == user.username


def test_login_is_rate_limited_after_too_many_attempts(api_client, user):
    """Proteção contra força bruta: settings.DEFAULT_THROTTLE_RATES["auth"]
    = "5/min". A 6ª tentativa (independente de acertar a senha) deve ser
    bloqueada com 429, não processada normalmente."""
    for _ in range(5):
        api_client.post(
            "/api/auth/token/",
            {"username": user.username, "password": "senha-errada"},
        )

    response = api_client.post(
        "/api/auth/token/",
        {"username": user.username, "password": "senha-errada"},
    )

    assert response.status_code == 429


def test_register_is_rate_limited_after_too_many_attempts(api_client):
    for i in range(5):
        api_client.post(
            "/api/auth/register/",
            {
                "username": f"spam{i}",
                "email": f"spam{i}@example.com",
                "password": "s3nhaSegura!23",
            },
        )

    response = api_client.post(
        "/api/auth/register/",
        {
            "username": "spam-extra",
            "email": "spam-extra@example.com",
            "password": "s3nhaSegura!23",
        },
    )

    assert response.status_code == 429


def test_logout_requires_authentication(api_client):
    response = api_client.post("/api/auth/logout/", {"refresh": "algum-token"})
    assert response.status_code == 401


def test_logout_requires_refresh_field(auth_client):
    response = auth_client.post("/api/auth/logout/", {})
    assert response.status_code == 400


def test_logout_blacklists_the_refresh_token(api_client, user):
    login = api_client.post(
        "/api/auth/token/",
        {"username": user.username, "password": "s3nhaSegura!23"},
    )
    access_token = login.data["access"]
    refresh_token = login.data["refresh"]

    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
    logout_response = api_client.post("/api/auth/logout/", {"refresh": refresh_token})
    assert logout_response.status_code == 205

    # O mesmo refresh token, usado de novo, não deve mais funcionar —
    # é exatamente isso que BLACKLIST_AFTER_ROTATION + o logout garantem.
    api_client.credentials()  # remove o header de auth, simula outra sessão
    refresh_response = api_client.post(
        "/api/auth/token/refresh/", {"refresh": refresh_token}
    )
    assert refresh_response.status_code == 401
