from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import ChatMessageListCreateView, ChatSessionViewSet

router = DefaultRouter()
router.register("ai/chat/sessions", ChatSessionViewSet, basename="chat-session")

urlpatterns = router.urls + [
    path(
        "ai/chat/sessions/<int:session_id>/messages/",
        ChatMessageListCreateView.as_view(),
        name="chat-messages",
    ),
]
