from django.urls import path

from .views import GoalSuggestionView

urlpatterns = [
    path(
        "ai/goals/<int:goal_id>/suggestion/",
        GoalSuggestionView.as_view(),
        name="ai-goal-suggestion",
    ),
]
