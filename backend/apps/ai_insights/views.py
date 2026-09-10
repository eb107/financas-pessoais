from rest_framework import mixins, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.ai_categorization.throttles import AICategorizationThrottle
from apps.common.permissions import IsOwner

from .models import Insight
from .serializers import InsightSerializer
from .tasks import generate_insights_task


class InsightViewSet(
    mixins.ListModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """Só lista e permite marcar como lida (PATCH `is_read`) — os insights
    em si só são criados pela task de geração, nunca via POST direto."""

    serializer_class = InsightSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        return Insight.objects.filter(user=self.request.user)


class TriggerInsightsView(APIView):
    """Dispara a geração de insights sob demanda (além da rotina diária
    automática via Celery beat) — útil pra testar sem esperar o próximo
    ciclo agendado."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [AICategorizationThrottle]

    def post(self, request):
        request.user.record_ai_consent()
        task = generate_insights_task.delay(request.user.id)
        return Response({"task_id": task.id, "status": "queued"}, status=202)
