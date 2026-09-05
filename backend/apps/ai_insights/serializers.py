from rest_framework import serializers

from .models import Insight


class InsightSerializer(serializers.ModelSerializer):
    class Meta:
        model = Insight
        fields = [
            "id",
            "type",
            "title",
            "body",
            "severity",
            "is_read",
            "generated_at",
        ]
        read_only_fields = [
            "id",
            "type",
            "title",
            "body",
            "severity",
            "generated_at",
        ]
