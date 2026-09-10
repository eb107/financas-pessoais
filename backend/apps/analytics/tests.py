from datetime import date, timedelta

import pytest

from apps.categories.models import Category
from apps.transactions.models import Transaction
from apps.wallets.models import Wallet

pytestmark = pytest.mark.django_db


@pytest.fixture
def wallet(user):
    return Wallet.objects.create(user=user, name="Nubank")


def test_summary_computes_income_expense_and_balance(auth_client, wallet):
    Transaction.objects.create(
        wallet=wallet, amount=1000, type="income", date=date(2026, 1, 5)
    )
    Transaction.objects.create(
        wallet=wallet, amount=300, type="expense", date=date(2026, 1, 10)
    )

    response = auth_client.get("/api/analytics/summary/")

    assert response.data["income"] == 1000
    assert response.data["expense"] == 300
    assert response.data["balance"] == 700
    assert response.data["transaction_count"] == 2


def test_summary_only_considers_own_wallets(auth_client, other_user):
    other_wallet = Wallet.objects.create(user=other_user, name="Carteira do bob")
    Transaction.objects.create(
        wallet=other_wallet, amount=1000, type="income", date=date(2026, 1, 5)
    )

    response = auth_client.get("/api/analytics/summary/")

    assert response.data["transaction_count"] == 0


def test_by_category_groups_expenses_correctly(auth_client, wallet, user):
    alimentacao = Category.objects.create(user=user, name="Alimentação", kind="expense")
    transporte = Category.objects.create(user=user, name="Transporte", kind="expense")
    Transaction.objects.create(
        wallet=wallet,
        category=alimentacao,
        amount=100,
        type="expense",
        date=date.today(),
    )
    Transaction.objects.create(
        wallet=wallet,
        category=alimentacao,
        amount=50,
        type="expense",
        date=date.today(),
    )
    Transaction.objects.create(
        wallet=wallet, category=transporte, amount=30, type="expense", date=date.today()
    )

    response = auth_client.get("/api/analytics/by-category/")

    totals = {row["category_name"]: row["total"] for row in response.data}
    assert totals["Alimentação"] == 150
    assert totals["Transporte"] == 30


def test_cashflow_computes_cumulative_balance_across_months(auth_client, wallet):
    # CashflowView calcula a janela a partir de date.today(), então as
    # transações de teste precisam ser relativas a "hoje" (não datas fixas)
    # para caírem dentro do filtro `date >= date_from`.
    this_month = date.today().replace(day=1)
    last_month = (this_month - timedelta(days=1)).replace(day=1)

    Transaction.objects.create(
        wallet=wallet, amount=1000, type="income", date=last_month
    )
    Transaction.objects.create(
        wallet=wallet, amount=400, type="expense", date=last_month
    )
    Transaction.objects.create(
        wallet=wallet, amount=200, type="expense", date=this_month
    )

    response = auth_client.get("/api/analytics/cashflow/", {"months": 3})

    assert len(response.data) == 2
    previous, current = response.data[0], response.data[1]
    assert float(previous["cumulative_balance"]) == 600.0
    assert float(current["cumulative_balance"]) == 400.0
