from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from apps.common.permissions import IsOwner

from .models import Goal
from .serializers import GoalSerializer


class GoalViewSet(ModelViewSet):
    serializer_class = GoalSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        return Goal.objects.filter(user=self.request.user).select_related("wallet")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
