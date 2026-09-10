from datetime import date

import pytest
from django.test import override_settings

from apps.goals.models import Goal
from apps.wallets.models import Wallet

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


@pytest.fixture
def goal(wallet):
    return Goal.objects.create(
        user=wallet.user,
        name="Comprar um carro",
        target_amount=10000,
        target_date=months_from_now(10),
        wallet=wallet,
    )


@override_settings(ANTHROPIC_API_KEY="")
def test_no_api_key_returns_graceful_message(auth_client, goal):
    response = auth_client.post(f"/api/ai/goals/{goal.id}/suggestion/")

    assert response.status_code == 200
    assert "suggestion" not in response.data


@override_settings(ANTHROPIC_API_KEY="fake-key-for-test")
def test_suggestion_endpoint_returns_ai_text(auth_client, goal, monkeypatch):
    monkeypatch.setattr(
        "apps.ai_goals.views.suggest_goal_plan",
        lambda prompt: "Corte gastos com delivery para atingir a meta mais rápido.",
    )

    response = auth_client.post(f"/api/ai/goals/{goal.id}/suggestion/")

    assert response.status_code == 200
    assert "delivery" in response.data["suggestion"]


@override_settings(ANTHROPIC_API_KEY="fake-key-for-test")
def test_suggestion_endpoint_records_ai_consent(auth_client, user, goal):
    assert user.ai_consent_given_at is None

    auth_client.post(f"/api/ai/goals/{goal.id}/suggestion/")

    user.refresh_from_db()
    assert user.ai_consent_given_at is not None


def test_returns_404_for_goal_from_another_user(auth_client, other_user):
    other_wallet = Wallet.objects.create(user=other_user, name="Carteira do bob")
    other_goal = Goal.objects.create(
        user=other_user,
        name="Meta do bob",
        target_amount=1000,
        target_date=months_from_now(1),
        wallet=other_wallet,
    )

    response = auth_client.post(f"/api/ai/goals/{other_goal.id}/suggestion/")

    assert response.status_code == 404
