from datetime import date

import pytest
from django.test import override_settings

from apps.categories.models import Category
from apps.transactions.models import Transaction
from apps.wallets.models import Wallet

from .rules import categorize_by_rules

pytestmark = pytest.mark.django_db


class TestCategorizeByRules:
    def test_matches_known_keyword(self):
        assert categorize_by_rules("Uber para o trabalho") == "Transporte"

    def test_is_case_insensitive(self):
        assert categorize_by_rules("ifood pedido 123") == "Alimentação"

    def test_returns_none_for_unknown_description(self):
        assert categorize_by_rules("Pagamento diverso xyz") is None


@pytest.fixture
def wallet(user):
    return Wallet.objects.create(user=user, name="Nubank")


def test_rule_match_categorizes_without_calling_ai(auth_client, wallet, user):
    Category.objects.create(user=user, name="Transporte", kind="expense")
    transaction = Transaction.objects.create(
        wallet=wallet, amount=25, type="expense", date=date.today(), description="Uber"
    )

    response = auth_client.post(f"/api/ai/transactions/{transaction.id}/categorize/")

    assert response.status_code == 200
    assert response.data["source"] == "rule"
    assert response.data["confidence"] == 1.0
    transaction.refresh_from_db()
    assert transaction.category.name == "Transporte"


@override_settings(ANTHROPIC_API_KEY="")
def test_no_rule_match_and_no_api_key_returns_graceful_message(auth_client, wallet):
    transaction = Transaction.objects.create(
        wallet=wallet,
        amount=25,
        type="expense",
        date=date.today(),
        description="Pagamento diverso xyz",
    )

    response = auth_client.post(f"/api/ai/transactions/{transaction.id}/categorize/")

    assert response.status_code == 200
    assert response.data["source"] is None
    transaction.refresh_from_db()
    assert transaction.category is None


@override_settings(ANTHROPIC_API_KEY="fake-key-for-test")
def test_no_rule_match_falls_back_to_ai(auth_client, wallet, user, monkeypatch):
    Category.objects.create(user=user, name="Lazer", kind="expense")
    transaction = Transaction.objects.create(
        wallet=wallet,
        amount=25,
        type="expense",
        date=date.today(),
        description="Pagamento diverso xyz",
    )

    monkeypatch.setattr(
        "apps.ai_categorization.views.categorize_transaction",
        lambda description, category_names: "Lazer",
    )

    response = auth_client.post(f"/api/ai/transactions/{transaction.id}/categorize/")

    assert response.status_code == 200
    assert response.data["source"] == "ai"
    assert response.data["confidence"] == 0.8
    transaction.refresh_from_db()
    assert transaction.category.name == "Lazer"


def test_returns_404_for_transaction_from_another_user(auth_client, other_user):
    other_wallet = Wallet.objects.create(user=other_user, name="Carteira do bob")
    other_transaction = Transaction.objects.create(
        wallet=other_wallet, amount=25, type="expense", date=date.today()
    )

    response = auth_client.post(
        f"/api/ai/transactions/{other_transaction.id}/categorize/"
    )

    assert response.status_code == 404
