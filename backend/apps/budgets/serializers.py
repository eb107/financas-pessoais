from django.db.models import Q, Sum
from rest_framework import serializers

from apps.categories.models import Category
from apps.transactions.models import Transaction

from .models import Budget


class BudgetSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    spent = serializers.SerializerMethodField()
    remaining = serializers.SerializerMethodField()
    percentage = serializers.SerializerMethodField()

    class Meta:
        model = Budget
        fields = [
            "id",
            "category",
            "category_name",
            "month",
            "amount_limit",
            "spent",
            "remaining",
            "percentage",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._spent_cache = {}
        request = self.context.get("request")
        if request is None:
            return
        self.fields["category"].queryset = Category.objects.filter(
            Q(user=request.user) | Q(user__isnull=True)
        )

    def _spent(self, obj) -> float:
        if obj.pk not in self._spent_cache:
            total = Transaction.objects.filter(
                wallet__user=obj.user,
                category=obj.category,
                type="expense",
                date__year=obj.month.year,
                date__month=obj.month.month,
            ).aggregate(total=Sum("amount"))["total"]
            self._spent_cache[obj.pk] = total or 0
        return self._spent_cache[obj.pk]

    def get_spent(self, obj):
        return self._spent(obj)

    def get_remaining(self, obj):
        return obj.amount_limit - self._spent(obj)

    def get_percentage(self, obj):
        if obj.amount_limit == 0:
            return 0
        return round(float(self._spent(obj)) / float(obj.amount_limit) * 100, 1)

    def validate_month(self, value):
        return value.replace(day=1)
