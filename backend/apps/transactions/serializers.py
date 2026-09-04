from django.db.models import Q
from rest_framework import serializers

from apps.categories.models import Category, Tag
from apps.wallets.models import Wallet

from .models import Transaction


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = [
            "id",
            "wallet",
            "category",
            "tags",
            "amount",
            "type",
            "description",
            "date",
            "is_recurring",
            "ai_category_confidence",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "ai_category_confidence", "created_at", "updated_at"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request is None:
            return
        user = request.user
        self.fields["wallet"].queryset = Wallet.objects.filter(user=user)
        self.fields["category"].queryset = Category.objects.filter(
            Q(user=user) | Q(user__isnull=True)
        )
        self.fields["tags"].child_relation.queryset = Tag.objects.filter(user=user)
