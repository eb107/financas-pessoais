from django.contrib import admin

from .models import Insight


@admin.register(Insight)
class InsightAdmin(admin.ModelAdmin):
    list_display = ["title", "user", "severity", "is_read", "generated_at"]
    list_filter = ["severity", "type", "is_read"]
