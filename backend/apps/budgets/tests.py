from datetime import date

import pytest

from apps.categories.models import Category
from apps.transactions.models import Transaction
from apps.wallets.models import Wallet

from .models import Budget

pytestmark = pytest.mark.django_db


@pytest.fixture
def wallet(user):
    return Wallet.objects.create(user=user, name="Nubank")


@pytest.fixture
def category(user):
    return Category.objects.create(user=user, name="Alimentação", kind="expense")


def test_create_budget_normalizes_month_to_first_day(auth_client, category):
    response = auth_client.post(
        "/api/budgets/",
        {"category": category.id, "month": "2026-01-15", "amount_limit": "500"},
    )

    assert response.status_code == 201
    assert response.data["month"] == "2026-01-01"


def test_cannot_create_duplicate_budget_for_same_category_and_month(
    auth_client, user, category
):
    Budget.objects.create(
        user=user, category=category, month=date(2026, 1, 1), amount_limit=500
    )

    response = auth_client.post(
        "/api/budgets/",
        {"category": category.id, "month": "2026-01-01", "amount_limit": "600"},
    )

    assert response.status_code == 400


def test_spent_remaining_and_percentage_are_computed_from_transactions(
    auth_client, wallet, category
):
    Budget.objects.create(
        user=wallet.user, category=category, month=date(2026, 1, 1), amount_limit=500
    )
    Transaction.objects.create(
        wallet=wallet,
        category=category,
        amount=150,
        type="expense",
        date=date(2026, 1, 10),
    )
    Transaction.objects.create(
        wallet=wallet,
        category=category,
        amount=50,
        type="expense",
        date=date(2026, 1, 20),
    )

    response = auth_client.get("/api/budgets/")
    data = response.data["results"][0]

    assert data["spent"] == 200
    assert data["remaining"] == 300
    assert data["percentage"] == 40.0


def test_cannot_use_another_users_category_in_budget(auth_client, other_user):
    other_category = Category.objects.create(
        user=other_user, name="Categoria do bob", kind="expense"
    )

    response = auth_client.post(
        "/api/budgets/",
        {"category": other_category.id, "month": "2026-01-01", "amount_limit": "500"},
    )

    assert response.status_code == 400
