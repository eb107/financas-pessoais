from django.contrib import admin

from .models import Budget


@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = ["category", "user", "month", "amount_limit"]
    list_filter = ["month"]
