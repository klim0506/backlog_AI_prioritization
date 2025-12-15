from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet, ProjectStatusViewSet

router = DefaultRouter()
router.register(r'project', ProjectViewSet, basename='project')
router.register(r'status', ProjectStatusViewSet, basename='status')

urlpatterns = [
    path('', include(router.urls)),
]

