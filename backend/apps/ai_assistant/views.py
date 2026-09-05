import anthropic
from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import mixins, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.ai_core.client import chat_completion
from apps.ai_core.prompts.chat import build_chat_system_prompt
from apps.common.permissions import IsOwner

from .context import build_financial_context
from .models import ChatMessage, ChatSession
from .serializers import (
    ChatMessageSerializer,
    ChatSessionSerializer,
    SendMessageSerializer,
)
from .throttles import AIChatThrottle


class ChatSessionViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = ChatSessionSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        return ChatSession.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ChatMessageListCreateView(APIView):
    """GET lista o histórico da sessão; POST manda uma mensagem nova e
    devolve a resposta do assistente (contexto agregado + histórico da
    conversa são enviados pro Claude a cada chamada)."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [AIChatThrottle]

    def get_session(self, request, session_id):
        return get_object_or_404(ChatSession, id=session_id, user=request.user)

    def get(self, request, session_id):
        session = self.get_session(request, session_id)
        messages = session.messages.all()
        return Response(ChatMessageSerializer(messages, many=True).data)

    def post(self, request, session_id):
        session = self.get_session(request, session_id)
        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user_content = serializer.validated_data["content"]

        user_message = ChatMessage.objects.create(
            session=session, role=ChatMessage.Role.USER, content=user_content
        )

        if not settings.ANTHROPIC_API_KEY:
            assistant_message = ChatMessage.objects.create(
                session=session,
                role=ChatMessage.Role.ASSISTANT,
                content=(
                    "Chat por IA não configurado ainda (falta ANTHROPIC_API_KEY "
                    "no .env)."
                ),
            )
        else:
            history = session.messages.order_by("created_at")
            claude_messages = [{"role": m.role, "content": m.content} for m in history]

            context_summary = build_financial_context(request.user)
            system_prompt = build_chat_system_prompt(context_summary)

            try:
                reply_text, tokens_used = chat_completion(
                    system_prompt, claude_messages
                )
            except anthropic.APIError:
                reply_text, tokens_used = (
                    "Não consegui falar com a IA agora. Tente de novo em instantes.",
                    None,
                )

            assistant_message = ChatMessage.objects.create(
                session=session,
                role=ChatMessage.Role.ASSISTANT,
                content=reply_text,
                tokens_used=tokens_used,
            )

        if not session.title:
            session.title = user_content[:60]
            session.save(update_fields=["title"])

        return Response(
            {
                "user_message": ChatMessageSerializer(user_message).data,
                "assistant_message": ChatMessageSerializer(assistant_message).data,
            },
            status=201,
        )
