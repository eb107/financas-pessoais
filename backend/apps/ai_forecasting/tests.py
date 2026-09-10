from datetime import date

import pytest

from apps.categories.models import Category
from apps.transactions.models import Transaction
from apps.wallets.models import Wallet

from .forecasting import generate_forecasts_for_user
from .models import ForecastResult

pytestmark = pytest.mark.django_db


@pytest.fixture
def wallet(user):
    return Wallet.objects.create(user=user, name="Nubank")


@pytest.fixture
def category(user):
    return Category.objects.create(user=user, name="Alimentação", kind="expense")


def _create_monthly_expenses(wallet, category, amounts_by_month):
    for month, amount in amounts_by_month.items():
        Transaction.objects.create(
            wallet=wallet,
            category=category,
            amount=amount,
            type="expense",
            date=date(2026, month, 5),
        )


def test_no_forecast_below_minimum_months_of_data(user, wallet, category):
    _create_monthly_expenses(wallet, category, {1: 100, 2: 110})

    results = generate_forecasts_for_user(user)

    assert results == []
    assert ForecastResult.objects.count() == 0


def test_forecast_generated_with_enough_months_of_data(user, wallet, category):
    _create_monthly_expenses(wallet, category, {1: 100, 2: 100, 3: 100})

    results = generate_forecasts_for_user(user)

    # Um total geral (category=None) + um por categoria usada.
    assert len(results) == 2
    total_forecast = ForecastResult.objects.get(user=user, category=None)
    assert total_forecast.period == date(2026, 4, 1)
    assert total_forecast.model_used == "linear_regression_v1"


def test_forecast_is_idempotent_per_user_category_period(user, wallet, category):
    """update_or_create garante que rodar de novo não duplica, só atualiza."""
    _create_monthly_expenses(wallet, category, {1: 100, 2: 100, 3: 100})

    generate_forecasts_for_user(user)
    generate_forecasts_for_user(user)

    assert ForecastResult.objects.filter(user=user, category=None).count() == 1


def test_trigger_forecast_view_runs_synchronously_in_tests(
    auth_client, wallet, category
):
    """CELERY_TASK_ALWAYS_EAGER (config/settings/test.py) faz a task rodar em
    processo — o resultado já existe no banco assim que a resposta volta."""
    _create_monthly_expenses(wallet, category, {1: 100, 2: 100, 3: 100})

    response = auth_client.post("/api/ai/forecast/generate/")

    assert response.status_code == 202
    assert ForecastResult.objects.filter(user__isnull=False).exists()


def test_forecast_list_only_returns_own_forecasts(auth_client, user, other_user):
    ForecastResult.objects.create(
        user=user,
        category=None,
        period=date(2026, 2, 1),
        predicted_amount=100,
        model_used="linear_regression_v1",
    )
    ForecastResult.objects.create(
        user=other_user,
        category=None,
        period=date(2026, 2, 1),
        predicted_amount=999,
        model_used="linear_regression_v1",
    )

    response = auth_client.get("/api/ai/forecast/")

    assert len(response.data["results"]) == 1
    assert response.data["results"][0]["predicted_amount"] == "100.00"
