import pytest

from .models import Wallet

pytestmark = pytest.mark.django_db


def test_create_wallet_assigns_authenticated_user(auth_client, user):
    response = auth_client.post("/api/wallets/", {"name": "Nubank", "type": "checking"})
    assert response.status_code == 201
    wallet = Wallet.objects.get(id=response.data["id"])
    assert wallet.user == user


def test_list_only_returns_own_wallets(auth_client, user, other_user):
    Wallet.objects.create(user=user, name="Minha carteira")
    Wallet.objects.create(user=other_user, name="Carteira do bob")

    response = auth_client.get("/api/wallets/")

    names = [w["name"] for w in response.data["results"]]
    assert names == ["Minha carteira"]


def test_cannot_retrieve_another_users_wallet(auth_client, other_user):
    other_wallet = Wallet.objects.create(user=other_user, name="Carteira do bob")

    response = auth_client.get(f"/api/wallets/{other_wallet.id}/")

    assert response.status_code == 404


def test_cannot_delete_another_users_wallet(auth_client, other_user):
    other_wallet = Wallet.objects.create(user=other_user, name="Carteira do bob")

    response = auth_client.delete(f"/api/wallets/{other_wallet.id}/")

    assert response.status_code == 404
    assert Wallet.objects.filter(id=other_wallet.id).exists()


def test_unauthenticated_request_is_rejected(api_client):
    response = api_client.get("/api/wallets/")
    assert response.status_code == 401
