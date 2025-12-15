from django.urls import path
from .views import login_view, logout_view, current_user

urlpatterns = [
    path('login/', login_view, name='login'),
    path('logout/', logout_view, name='logout'),
    path('current/', current_user, name='current_user'),
]

