from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.common.models import AuditLog

from .data_export import build_user_data_export
from .serializers import RegisterSerializer, UserSerializer
from .throttles import AuthRateThrottle


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthRateThrottle]


class LoginView(TokenObtainPairView):
    throttle_classes = [AuthRateThrottle]


class RefreshView(TokenRefreshView):
    throttle_classes = [AuthRateThrottle]


class LogoutView(APIView):
    """Revoga o refresh token enviado (blacklist), invalidando a sessão no
    servidor. Sem isto, "logout" era só um efeito visual no frontend (limpar
    o localStorage) — o token continuava válido no backend até expirar
    sozinho, mesmo depois do usuário "sair"."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh = request.data.get("refresh")
        if not refresh:
            return Response(
                {"detail": "Campo 'refresh' é obrigatório."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            RefreshToken(refresh).blacklist()
        except TokenError:
            return Response(
                {"detail": "Token inválido ou já expirado."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(status=status.HTTP_205_RESET_CONTENT)


class MeView(generics.RetrieveDestroyAPIView):
    """GET retorna o usuário atual. DELETE apaga a conta (direito de
    exclusão, LGPD Art. 18) — o cascade das ForeignKeys (Wallet, Category,
    Tag, Budget, ForecastResult, Insight, ChatSession) já garante que todo
    o dado pessoal associado é removido junto, numa única operação."""

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def destroy(self, request, *args, **kwargs):
        # Exclusão é irreversível — exigir a senha atual de novo evita que
        # um access token vazado (30 min de vida, guardado em localStorage)
        # seja suficiente sozinho pra apagar a conta inteira.
        password = request.data.get("current_password")
        if not password or not request.user.check_password(password):
            return Response(
                {"detail": "Senha atual incorreta ou não informada."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)

    def perform_destroy(self, instance):
        # Registrado ANTES do delete, e com SET_NULL no FK do AuditLog:
        # a evidência de que a conta foi excluída precisa sobreviver à
        # própria exclusão da conta.
        AuditLog.objects.create(
            user=instance,
            username=instance.username,
            action=AuditLog.Action.ACCOUNT_DELETION,
        )
        instance.delete()


class MeExportView(APIView):
    """Exporta todos os dados pessoais do usuário autenticado num JSON só
    (direito de portabilidade, LGPD Art. 18)."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        AuditLog.objects.create(
            user=request.user,
            username=request.user.username,
            action=AuditLog.Action.DATA_EXPORT,
        )
        return Response(build_user_data_export(request.user))


class AIConsentView(APIView):
    """Permite revogar o consentimento de IA a qualquer momento (LGPD
    Art. 8º, §5º / Art. 18, IX), com efeito real: enquanto revogado, a
    rotina automática de insights (Celery beat) não chama a Anthropic pra
    esse usuário — ver o gate em apps/ai_insights/tasks.py. Usar qualquer
    funcionalidade de IA de novo concede o consentimento outra vez
    automaticamente (User.record_ai_consent)."""

    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        request.user.ai_consent_given_at = None
        request.user.save(update_fields=["ai_consent_given_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)
