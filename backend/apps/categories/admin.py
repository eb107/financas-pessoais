from django.contrib import admin

from .models import Category, Tag


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "kind", "user", "parent"]
    list_filter = ["kind"]
    search_fields = ["name"]


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ["name", "user"]
    search_fields = ["name"]
