from datetime import date, timedelta

import pytest
from django.contrib.auth.models import AnonymousUser
from django.core.management import call_command
from django.test import RequestFactory
from django.utils import timezone

from apps.ai_insights.models import Insight
from apps.common.permissions import IsOwner
from apps.transactions.models import Transaction
from apps.wallets.models import Wallet

pytestmark = pytest.mark.django_db


def test_health_check_is_public(client):
    response = client.get("/api/health/")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


class TestIsOwner:
    def _request_for(self, user):
        request = RequestFactory().get("/")
        request.user = user
        return request

    def test_allows_direct_owner(self, user):
        wallet = Wallet.objects.create(user=user, name="Nubank")
        assert IsOwner().has_object_permission(self._request_for(user), None, wallet)

    def test_denies_non_owner(self, user, other_user):
        wallet = Wallet.objects.create(user=user, name="Nubank")
        assert not IsOwner().has_object_permission(
            self._request_for(other_user), None, wallet
        )

    def test_allows_indirect_owner_via_wallet(self, user):
        wallet = Wallet.objects.create(user=user, name="Nubank")
        transaction = Transaction.objects.create(
            wallet=wallet, amount=10, type="expense", date=date.today()
        )
        assert IsOwner().has_object_permission(
            self._request_for(user), None, transaction
        )

    def test_denies_anonymous(self, user):
        wallet = Wallet.objects.create(user=user, name="Nubank")
        assert not IsOwner().has_object_permission(
            self._request_for(AnonymousUser()), None, wallet
        )


def test_purge_old_data_removes_insights_past_retention_but_keeps_recent_ones(user):
    """LGPD Art. 15/16 — retenção: insight velho não tem valor de negócio
    nenhum depois de um tempo, e não deveria ficar guardado pra sempre."""
    old_insight = Insight.objects.create(
        user=user, type="budget_exceeded", title="Velho", body="...", severity="info"
    )
    Insight.objects.filter(pk=old_insight.pk).update(
        generated_at=timezone.now() - timedelta(days=400)
    )
    recent_insight = Insight.objects.create(
        user=user, type="budget_exceeded", title="Recente", body="...", severity="info"
    )

    call_command("purge_old_data", insights_days=365)

    assert not Insight.objects.filter(pk=old_insight.pk).exists()
    assert Insight.objects.filter(pk=recent_insight.pk).exists()
