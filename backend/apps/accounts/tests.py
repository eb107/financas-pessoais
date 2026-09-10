import pytest

pytestmark = pytest.mark.django_db


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
