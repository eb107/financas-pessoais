from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.ai_categorization.throttles import AICategorizationThrottle

from .models import ForecastResult
from .serializers import ForecastResultSerializer
from .tasks import generate_forecast_task


class TriggerForecastView(APIView):
    """Dispara a geração de previsão em background (Celery) e retorna na hora.

    O resultado não vem nessa resposta — o cálculo roda no worker; o
    frontend consulta GET /api/ai/forecast/ depois pra pegar o resultado.
    """

    permission_classes = [IsAuthenticated]
    throttle_classes = [AICategorizationThrottle]

    def post(self, request):
        task = generate_forecast_task.delay(request.user.id)
        return Response({"task_id": task.id, "status": "queued"}, status=202)


class ForecastListView(generics.ListAPIView):
    serializer_class = ForecastResultSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ForecastResult.objects.filter(
            user=self.request.user
        ).select_related("category")
