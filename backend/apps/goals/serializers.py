from datetime import date
from decimal import Decimal

from django.db.models import Sum
from rest_framework import serializers

from apps.transactions.models import Transaction
from apps.wallets.models import Wallet

from .models import Goal


class GoalSerializer(serializers.ModelSerializer):
    wallet_name = serializers.CharField(source="wallet.name", read_only=True)
    current_amount = serializers.SerializerMethodField()
    months_remaining = serializers.SerializerMethodField()
    monthly_required = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()
    is_achieved = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()

    class Meta:
        model = Goal
        fields = [
            "id",
            "name",
            "target_amount",
            "target_date",
            "wallet",
            "wallet_name",
            "current_amount",
            "months_remaining",
            "monthly_required",
            "progress_percentage",
            "is_achieved",
            "is_overdue",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._current_amount_cache = {}
        request = self.context.get("request")
        if request is None:
            return
        # Mesma proteção contra IDOR usada em Transaction/Budget: sem isso,
        # o ID de uma carteira de outro usuário seria aceito no POST.
        self.fields["wallet"].queryset = Wallet.objects.filter(user=request.user)

    def _current_amount(self, obj) -> Decimal:
        if obj.pk not in self._current_amount_cache:
            income = Transaction.objects.filter(
                wallet=obj.wallet, type="income"
            ).aggregate(total=Sum("amount"))["total"] or Decimal(0)
            expense = Transaction.objects.filter(
                wallet=obj.wallet, type="expense"
            ).aggregate(total=Sum("amount"))["total"] or Decimal(0)
            self._current_amount_cache[obj.pk] = income - expense
        return self._current_amount_cache[obj.pk]

    def get_current_amount(self, obj):
        return self._current_amount(obj)

    def get_months_remaining(self, obj) -> int:
        today = date.today()
        if obj.target_date <= today:
            return 0
        months = (obj.target_date.year - today.year) * 12 + (
            obj.target_date.month - today.month
        )
        return max(months, 1)

    def get_monthly_required(self, obj):
        remaining_amount = obj.target_amount - self._current_amount(obj)
        if remaining_amount <= 0:
            return 0
        months = self.get_months_remaining(obj)
        if months == 0:
            return round(float(remaining_amount), 2)
        return round(float(remaining_amount) / months, 2)

    def get_progress_percentage(self, obj):
        if obj.target_amount == 0:
            return 0
        pct = float(self._current_amount(obj)) / float(obj.target_amount) * 100
        return round(max(pct, 0), 1)

    def get_is_achieved(self, obj) -> bool:
        return self._current_amount(obj) >= obj.target_amount

    def get_is_overdue(self, obj) -> bool:
        return obj.target_date < date.today() and not self.get_is_achieved(obj)
