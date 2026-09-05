from rest_framework import serializers

from .models import ForecastResult


class ForecastResultSerializer(serializers.ModelSerializer):
    category_name = serializers.SerializerMethodField()

    class Meta:
        model = ForecastResult
        fields = [
            "id",
            "category",
            "category_name",
            "period",
            "predicted_amount",
            "model_used",
            "generated_at",
        ]
        read_only_fields = fields

    def get_category_name(self, obj):
        return obj.category.name if obj.category else "Total geral"
