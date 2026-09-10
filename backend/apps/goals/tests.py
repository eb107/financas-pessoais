from datetime import date
from decimal import Decimal

import pytest

from apps.transactions.models import Transaction
from apps.wallets.models import Wallet

from .models import Goal

pytestmark = pytest.mark.django_db


def months_from_now(months: int) -> date:
    today = date.today()
    total_month = today.month - 1 + months
    year = today.year + total_month // 12
    month = total_month % 12 + 1
    return date(year, month, min(today.day, 28))


@pytest.fixture
def wallet(user):
    return Wallet.objects.create(user=user, name="Poupança carro")


def test_create_goal(auth_client, wallet):
    target_date = months_from_now(10)

    response = auth_client.post(
        "/api/goals/",
        {
            "name": "Comprar um carro",
            "target_amount": "20000",
            "target_date": target_date.isoformat(),
            "wallet": wallet.id,
        },
    )

    assert response.status_code == 201
    assert response.data["name"] == "Comprar um carro"
    assert response.data["wallet_name"] == "Poupança carro"


def test_current_amount_and_progress_come_from_wallet_transactions(auth_client, wallet):
    target_date = months_from_now(10)
    goal = Goal.objects.create(
        user=wallet.user,
        name="Comprar um carro",
        target_amount=10000,
        target_date=target_date,
        wallet=wallet,
    )
    Transaction.objects.create(
        wallet=wallet, amount=3000, type="income", date=date.today()
    )
    Transaction.objects.create(
        wallet=wallet, amount=500, type="expense", date=date.today()
    )

    response = auth_client.get(f"/api/goals/{goal.id}/")

    assert response.data["current_amount"] == Decimal("2500.00")
    assert response.data["progress_percentage"] == 25.0
    assert response.data["is_achieved"] is False


def test_monthly_required_accounts_for_current_amount(auth_client, wallet):
    target_date = months_from_now(5)
    goal = Goal.objects.create(
        user=wallet.user,
        name="Reserva",
        target_amount=5000,
        target_date=target_date,
        wallet=wallet,
    )
    Transaction.objects.create(
        wallet=wallet, amount=1000, type="income", date=date.today()
    )

    response = auth_client.get(f"/api/goals/{goal.id}/")

    assert response.data["monthly_required"] == 800.0


def test_goal_is_achieved_when_current_amount_reaches_target(auth_client, wallet):
    goal = Goal.objects.create(
        user=wallet.user,
        name="Meta pequena",
        target_amount=100,
        target_date=months_from_now(1),
        wallet=wallet,
    )
    Transaction.objects.create(
        wallet=wallet, amount=150, type="income", date=date.today()
    )

    response = auth_client.get(f"/api/goals/{goal.id}/")

    assert response.data["is_achieved"] is True
    assert response.data["monthly_required"] == 0


def test_goal_is_overdue_when_target_date_passed_and_not_achieved(auth_client, wallet):
    goal = Goal.objects.create(
        user=wallet.user,
        name="Meta atrasada",
        target_amount=10000,
        target_date=months_from_now(-1),
        wallet=wallet,
    )

    response = auth_client.get(f"/api/goals/{goal.id}/")

    assert response.data["is_overdue"] is True


def test_cannot_use_another_users_wallet_in_goal(auth_client, other_user):
    other_wallet = Wallet.objects.create(user=other_user, name="Carteira do bob")

    response = auth_client.post(
        "/api/goals/",
        {
            "name": "Meta suspeita",
            "target_amount": "1000",
            "target_date": (months_from_now(1)).isoformat(),
            "wallet": other_wallet.id,
        },
    )

    assert response.status_code == 400


def test_cannot_see_another_users_goals(auth_client, other_user):
    other_wallet = Wallet.objects.create(user=other_user, name="Carteira do bob")
    Goal.objects.create(
        user=other_user,
        name="Meta do bob",
        target_amount=1000,
        target_date=months_from_now(1),
        wallet=other_wallet,
    )

    response = auth_client.get("/api/goals/")

    assert response.data["count"] == 0
