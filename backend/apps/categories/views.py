from django.db.models import Q
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from apps.common.permissions import IsOwner

from .models import Category, Tag
from .serializers import CategorySerializer, TagSerializer


class CategoryViewSet(ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        user = self.request.user
        return Category.objects.filter(Q(user=user) | Q(user__isnull=True))

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TagViewSet(ModelViewSet):
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        return Tag.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
