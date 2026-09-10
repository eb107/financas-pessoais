from datetime import date

import pytest

from apps.categories.models import Category, Tag
from apps.wallets.models import Wallet

from .models import Transaction

pytestmark = pytest.mark.django_db


@pytest.fixture
def wallet(user):
    return Wallet.objects.create(user=user, name="Nubank")


@pytest.fixture
def category(user):
    return Category.objects.create(user=user, name="Alimentação", kind="expense")


def test_create_transaction(auth_client, wallet, category):
    response = auth_client.post(
        "/api/transactions/",
        {
            "wallet": wallet.id,
            "category": category.id,
            "amount": "45.90",
            "type": "expense",
            "description": "Almoço",
            "date": "2026-01-15",
        },
    )
    assert response.status_code == 201


def test_cannot_create_transaction_on_another_users_wallet(auth_client, other_user):
    """Proteção contra IDOR: o queryset do campo `wallet` no serializer é
    restrito ao usuário autenticado, então um ID de wallet alheio deve ser
    rejeitado na validação — nunca aceito silenciosamente."""
    other_wallet = Wallet.objects.create(user=other_user, name="Carteira do bob")

    response = auth_client.post(
        "/api/transactions/",
        {
            "wallet": other_wallet.id,
            "amount": "100",
            "type": "expense",
            "date": "2026-01-15",
        },
    )

    assert response.status_code == 400
    assert "wallet" in response.data


def test_cannot_use_another_users_category(auth_client, wallet, other_user):
    other_category = Category.objects.create(
        user=other_user, name="Categoria do bob", kind="expense"
    )

    response = auth_client.post(
        "/api/transactions/",
        {
            "wallet": wallet.id,
            "category": other_category.id,
            "amount": "100",
            "type": "expense",
            "date": "2026-01-15",
        },
    )

    assert response.status_code == 400
    assert "category" in response.data


def test_list_only_returns_transactions_from_own_wallets(
    auth_client, wallet, other_user
):
    other_wallet = Wallet.objects.create(user=other_user, name="Carteira do bob")
    Transaction.objects.create(
        wallet=wallet, amount=10, type="expense", date=date(2026, 1, 1)
    )
    Transaction.objects.create(
        wallet=other_wallet, amount=20, type="expense", date=date(2026, 1, 1)
    )

    response = auth_client.get("/api/transactions/")

    assert response.data["count"] == 1


def test_deleting_category_sets_transaction_category_to_null(wallet, category):
    """Confirma a decisão de design on_delete=SET_NULL: a transação
    sobrevive à exclusão da categoria, só perde a referência."""
    transaction = Transaction.objects.create(
        wallet=wallet, category=category, amount=10, type="expense", date=date.today()
    )

    category.delete()
    transaction.refresh_from_db()

    assert transaction.category is None


def test_filter_by_date_range(auth_client, wallet):
    Transaction.objects.create(
        wallet=wallet, amount=10, type="expense", date=date(2026, 1, 1)
    )
    Transaction.objects.create(
        wallet=wallet, amount=20, type="expense", date=date(2026, 3, 1)
    )

    response = auth_client.get(
        "/api/transactions/", {"date_from": "2026-02-01", "date_to": "2026-04-01"}
    )

    assert response.data["count"] == 1
    assert response.data["results"][0]["amount"] == "20.00"


def test_filter_by_search_on_description(auth_client, wallet):
    Transaction.objects.create(
        wallet=wallet,
        amount=10,
        type="expense",
        date=date.today(),
        description="Almoço no restaurante",
    )
    Transaction.objects.create(
        wallet=wallet, amount=20, type="expense", date=date.today(), description="Uber"
    )

    response = auth_client.get("/api/transactions/", {"search": "almoço"})

    assert response.data["count"] == 1


def test_filter_by_tag(auth_client, wallet):
    viagem = Tag.objects.create(user=wallet.user, name="viagem")
    t1 = Transaction.objects.create(
        wallet=wallet, amount=10, type="expense", date=date.today()
    )
    Transaction.objects.create(
        wallet=wallet, amount=20, type="expense", date=date.today()
    )
    t1.tags.add(viagem)

    response = auth_client.get("/api/transactions/", {"tag": viagem.id})

    assert response.data["count"] == 1
