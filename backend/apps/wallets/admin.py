from django.contrib import admin

from .models import Wallet


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ["name", "user", "type", "currency", "initial_balance"]
    list_filter = ["type", "currency"]
    search_fields = ["name", "user__username"]
