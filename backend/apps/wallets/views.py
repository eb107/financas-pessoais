from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from apps.common.permissions import IsOwner

from .models import Wallet
from .serializers import WalletSerializer


class WalletViewSet(ModelViewSet):
    serializer_class = WalletSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        return Wallet.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
