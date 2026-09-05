from celery import shared_task

from .forecasting import generate_forecasts_for_user


@shared_task
def generate_forecast_task(user_id: int) -> int:
    from apps.accounts.models import User

    user = User.objects.get(id=user_id)
    results = generate_forecasts_for_user(user)
    return len(results)
