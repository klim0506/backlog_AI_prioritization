from django.urls import path
from .views import LoginView, logout_view, current_user

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', logout_view, name='logout'),
    path('current/', current_user, name='current_user'),
]

