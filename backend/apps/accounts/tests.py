import pytest
from django.core.cache import cache

pytestmark = pytest.mark.django_db

TEST_PASSWORD = "s3nhaSegura!23"  # noqa: S105 — mesma senha das fixtures em conftest.py


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


def test_delete_account_requires_authentication(api_client):
    response = api_client.delete("/api/auth/me/")
    assert response.status_code == 401


def test_delete_account_requires_current_password(auth_client, user):
    """Exclusão é irreversível — um access token sozinho (vazado via XSS,
    por exemplo) não pode ser suficiente pra apagar a conta inteira."""
    from apps.accounts.models import User

    response = auth_client.delete("/api/auth/me/")

    assert response.status_code == 400
    assert User.objects.filter(id=user.id).exists()


def test_delete_account_rejects_wrong_current_password(auth_client, user):
    from apps.accounts.models import User

    response = auth_client.delete("/api/auth/me/", {"current_password": "senha-errada"})

    assert response.status_code == 400
    assert User.objects.filter(id=user.id).exists()


def test_delete_account_cascades_to_personal_data(auth_client, user):
    """Direito de exclusão (LGPD Art. 18): apagar a conta precisa apagar
    junto todo o dado pessoal associado, não deixar nada órfão pra trás."""
    from apps.accounts.models import User
    from apps.wallets.models import Wallet

    wallet = Wallet.objects.create(user=user, name="Nubank")

    response = auth_client.delete("/api/auth/me/", {"current_password": TEST_PASSWORD})

    assert response.status_code == 204
    assert not User.objects.filter(id=user.id).exists()
    assert not Wallet.objects.filter(id=wallet.id).exists()


def test_delete_account_leaves_an_audit_trail_that_survives_the_deletion(
    auth_client, user
):
    """O log da exclusão precisa sobreviver à própria exclusão da conta —
    senão a auditoria não prova nada. AuditLog.user usa SET_NULL de
    propósito (ver apps/common/models.py)."""
    from apps.common.models import AuditLog

    username = user.username

    auth_client.delete("/api/auth/me/", {"current_password": TEST_PASSWORD})

    log = AuditLog.objects.get(action=AuditLog.Action.ACCOUNT_DELETION)
    assert log.username == username
    assert log.user is None


def test_export_requires_authentication(api_client):
    response = api_client.get("/api/auth/me/export/")
    assert response.status_code == 401


def test_export_returns_only_the_authenticated_users_own_data(
    auth_client, user, other_user
):
    """Direito de portabilidade (LGPD Art. 18): exportar precisa trazer só
    o dado do próprio usuário, nunca vazar dado de outro."""
    from apps.wallets.models import Wallet

    Wallet.objects.create(user=user, name="Minha carteira")
    Wallet.objects.create(user=other_user, name="Carteira do bob")

    response = auth_client.get("/api/auth/me/export/")

    assert response.status_code == 200
    assert response.data["user"]["username"] == user.username
    wallet_names = [w["name"] for w in response.data["wallets"]]
    assert wallet_names == ["Minha carteira"]


def test_export_leaves_an_audit_trail(auth_client, user):
    from apps.common.models import AuditLog

    auth_client.get("/api/auth/me/export/")

    log = AuditLog.objects.get(action=AuditLog.Action.DATA_EXPORT)
    assert log.user == user
    assert log.username == user.username


def test_me_includes_ai_consent_status(auth_client):
    response = auth_client.get("/api/auth/me/")

    assert response.status_code == 200
    assert response.data["ai_consent_given_at"] is None


def test_revoke_ai_consent_requires_authentication(api_client):
    response = api_client.delete("/api/auth/ai-consent/")
    assert response.status_code == 401


def test_revoke_ai_consent_clears_the_timestamp(auth_client, user):
    """Direito de revogar consentimento a qualquer momento (LGPD Art. 8º,
    §5º / Art. 18, IX), com efeito real: o campo volta a None."""
    user.record_ai_consent()
    assert user.ai_consent_given_at is not None

    response = auth_client.delete("/api/auth/ai-consent/")

    assert response.status_code == 204
    user.refresh_from_db()
    assert user.ai_consent_given_at is None


def test_record_ai_consent_is_idempotent(user):
    assert user.ai_consent_given_at is None

    user.record_ai_consent()
    first_timestamp = user.ai_consent_given_at
    assert first_timestamp is not None

    user.record_ai_consent()
    assert user.ai_consent_given_at == first_timestamp


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
