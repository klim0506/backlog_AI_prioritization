from rest_framework import views, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from rest_framework import serializers
import logging

logger = logging.getLogger(__name__)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']


class LoginView(views.APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response(
                {'error': 'Необходимо указать username и password'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = authenticate(request, username=username, password=password)
        if user is not None:
            if user.is_active:
                login(request, user)
                request.session.save()
                logger.info(f"LOGIN User {username}")
                return Response({
                    'user': UserSerializer(user).data,
                    'message': 'Успешный вход'
                })
            else:
                return Response(
                    {'error': 'Аккаунт деактивирован'},
                    status=status.HTTP_403_FORBIDDEN
                )
        else:
            return Response(
                {'error': 'Неверные учетные данные'},
                status=status.HTTP_401_UNAUTHORIZED
            )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    username = request.user.username
    logout(request)
    logger.info(f"LOGOUT User {username}")
    return Response({'message': 'Успешный выход'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    return Response({
        'user': UserSerializer(request.user).data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def users_list(request):
    users = User.objects.filter(is_active=True).order_by('username')
    return Response({
        'users': [UserSerializer(user).data for user in users]
    })


class RegisterView(views.APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response(
                {'error': 'Необходимо указать username и password'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Проверяем, существует ли пользователь
        if User.objects.filter(username=username).exists():
            return Response(
                {'error': 'Пользователь с таким именем уже существует'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Создаем нового пользователя
        try:
            user = User.objects.create_user(
                username=username,
                password=password
            )
            logger.info(f"REGISTER User {username}")
            
            # Автоматически логиним пользователя после регистрации
            login(request, user)
            request.session.save()
            
            return Response({
                'user': UserSerializer(user).data,
                'message': 'Регистрация успешна'
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"REGISTER Error: {str(e)}")
            return Response(
                {'error': f'Ошибка при создании пользователя: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
