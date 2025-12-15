from rest_framework import views, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from rest_framework import serializers


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Авторизация пользователя"""
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response(
            {'error': 'Необходимо указать username и password'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = authenticate(request, username=username, password=password)
    if user is not None:
        login(request, user)
        return Response({
            'user': UserSerializer(user).data,
            'message': 'Успешный вход'
        })
    else:
        return Response(
            {'error': 'Неверные учетные данные'},
            status=status.HTTP_401_UNAUTHORIZED
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """Выход пользователя"""
    logout(request)
    return Response({'message': 'Успешный выход'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    """Получение текущего пользователя"""
    return Response({
        'user': UserSerializer(request.user).data
    })

