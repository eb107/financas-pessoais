import django_filters

from .models import Transaction


class TransactionFilter(django_filters.FilterSet):
    date_from = django_filters.DateFilter(field_name="date", lookup_expr="gte")
    date_to = django_filters.DateFilter(field_name="date", lookup_expr="lte")
    tag = django_filters.NumberFilter(field_name="tags__id")
    search = django_filters.CharFilter(
        field_name="description", lookup_expr="icontains"
    )

    class Meta:
        model = Transaction
        fields = ["wallet", "category", "type", "date_from", "date_to", "tag", "search"]
