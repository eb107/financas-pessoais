from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from apps.common.permissions import IsOwner

from .filters import TransactionFilter
from .models import Transaction
from .serializers import TransactionSerializer


class TransactionViewSet(ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    filterset_class = TransactionFilter

    def get_queryset(self):
        return Transaction.objects.filter(wallet__user=self.request.user)
