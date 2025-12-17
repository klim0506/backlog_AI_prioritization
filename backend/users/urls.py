from django.urls import path
from .views import LoginView, logout_view, current_user, users_list

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', logout_view, name='logout'),
    path('current/', current_user, name='current_user'),
    path('list/', users_list, name='users_list'),
]

