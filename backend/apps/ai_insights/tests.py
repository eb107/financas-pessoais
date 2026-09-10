from datetime import date

import pytest
from django.test import override_settings

from apps.budgets.models import Budget
from apps.categories.models import Category
from apps.transactions.models import Transaction
from apps.wallets.models import Wallet

from .detection import detect_budget_exceeded, detect_category_spikes
from .models import Insight
from .tasks import generate_insights_task

pytestmark = pytest.mark.django_db


@pytest.fixture
def wallet(user):
    return Wallet.objects.create(user=user, name="Nubank")


@pytest.fixture
def category(user):
    return Category.objects.create(user=user, name="Alimentação", kind="expense")


class TestDetectBudgetExceeded:
    def test_warning_when_slightly_over_limit(self, user, wallet, category):
        today = date(2026, 3, 15)
        Budget.objects.create(
            user=user, category=category, month=date(2026, 3, 1), amount_limit=100
        )
        Transaction.objects.create(
            wallet=wallet, category=category, amount=110, type="expense", date=today
        )

        patterns = detect_budget_exceeded(user, today)

        assert len(patterns) == 1
        assert patterns[0]["severity"] == "warning"
        assert patterns[0]["percentage"] == 110.0

    def test_critical_when_far_over_limit(self, user, wallet, category):
        today = date(2026, 3, 15)
        Budget.objects.create(
            user=user, category=category, month=date(2026, 3, 1), amount_limit=100
        )
        Transaction.objects.create(
            wallet=wallet, category=category, amount=150, type="expense", date=today
        )

        patterns = detect_budget_exceeded(user, today)

        assert patterns[0]["severity"] == "critical"

    def test_no_pattern_when_within_budget(self, user, wallet, category):
        today = date(2026, 3, 15)
        Budget.objects.create(
            user=user, category=category, month=date(2026, 3, 1), amount_limit=100
        )
        Transaction.objects.create(
            wallet=wallet, category=category, amount=50, type="expense", date=today
        )

        assert detect_budget_exceeded(user, today) == []


class TestDetectCategorySpikes:
    def test_flags_spike_above_threshold(self, user, wallet, category):
        Transaction.objects.create(
            wallet=wallet,
            category=category,
            amount=100,
            type="expense",
            date=date(2026, 2, 10),
        )
        Transaction.objects.create(
            wallet=wallet,
            category=category,
            amount=150,
            type="expense",
            date=date(2026, 3, 10),
        )

        patterns = detect_category_spikes(user, date(2026, 3, 15))

        assert len(patterns) == 1
        assert patterns[0]["change_pct"] == 50.0

    def test_ignores_spike_below_minimum_previous_amount(self, user, wallet, category):
        """Evita alarme falso: R$5 -> R$20 é +300%, mas a base é pequena
        demais pra significar algo (CATEGORY_SPIKE_MIN_PREVIOUS)."""
        Transaction.objects.create(
            wallet=wallet,
            category=category,
            amount=5,
            type="expense",
            date=date(2026, 2, 10),
        )
        Transaction.objects.create(
            wallet=wallet,
            category=category,
            amount=20,
            type="expense",
            date=date(2026, 3, 10),
        )

        assert detect_category_spikes(user, date(2026, 3, 15)) == []


@override_settings(ANTHROPIC_API_KEY="")
def test_generate_insights_task_creates_insight_from_raw_pattern(
    user, wallet, category
):
    """Sem ANTHROPIC_API_KEY, o texto cru da regra (pattern["raw"]) é usado
    direto como corpo do insight — sem chamar a IA."""
    today = date.today()
    Budget.objects.create(
        user=user, category=category, month=today.replace(day=1), amount_limit=100
    )
    Transaction.objects.create(
        wallet=wallet, category=category, amount=150, type="expense", date=today
    )

    created = generate_insights_task(user.id)

    assert created == 1
    insight = Insight.objects.get(user=user)
    assert insight.type == "budget_exceeded"
    assert "Alimentação" in insight.title


def test_insight_list_only_returns_own_insights(auth_client, user, other_user):
    Insight.objects.create(
        user=user, type="budget_exceeded", title="Minha", body="...", severity="warning"
    )
    Insight.objects.create(
        user=other_user,
        type="budget_exceeded",
        title="Do bob",
        body="...",
        severity="warning",
    )

    response = auth_client.get("/api/ai/insights/")

    titles = [i["title"] for i in response.data["results"]]
    assert titles == ["Minha"]


def test_can_mark_own_insight_as_read(auth_client, user):
    insight = Insight.objects.create(
        user=user, type="budget_exceeded", title="Minha", body="...", severity="warning"
    )

    response = auth_client.patch(f"/api/ai/insights/{insight.id}/", {"is_read": True})

    assert response.status_code == 200
    insight.refresh_from_db()
    assert insight.is_read is True


def test_cannot_mark_another_users_insight_as_read(auth_client, other_user):
    other_insight = Insight.objects.create(
        user=other_user,
        type="budget_exceeded",
        title="Do bob",
        body="...",
        severity="warning",
    )

    response = auth_client.patch(
        f"/api/ai/insights/{other_insight.id}/", {"is_read": True}
    )

    assert response.status_code == 404


def test_trigger_insights_view_runs_synchronously_in_tests(auth_client, user):
    response = auth_client.post("/api/ai/insights/generate/")
    assert response.status_code == 202
    assert "task_id" in response.data
