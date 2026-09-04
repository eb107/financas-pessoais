from django.contrib import admin

from .models import Transaction


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ["description", "wallet", "category", "type", "amount", "date"]
    list_filter = ["type", "is_recurring"]
    search_fields = ["description"]
    date_hierarchy = "date"
