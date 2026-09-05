from django.contrib import admin

from .models import ForecastResult


@admin.register(ForecastResult)
class ForecastResultAdmin(admin.ModelAdmin):
    list_display = ["user", "category", "period", "predicted_amount", "model_used"]
    list_filter = ["model_used", "period"]
