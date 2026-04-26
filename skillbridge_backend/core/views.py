from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from .models import Conversation, Message
from .serializers import ConversationSerializer, ConversationListSerializer, MessageSerializer

User = get_user_model()

class ConversationViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ConversationSerializer

    def get_queryset(self):
        return Conversation.objects.filter(participants=self.request.user)

    def get_serializer_class(self):
        if self.action == 'list':
            return ConversationListSerializer
        return ConversationSerializer

    @action(detail=False, methods=['post'])
    def start_conversation(self, request):
        other_user_id = request.data.get('user_id')
        if not other_user_id:
            return Response({'detail': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            other_user = User.objects.get(id=other_user_id)
        except User.DoesNotExist:
            return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        # Check if conversation already exists
        conversation = Conversation.objects.filter(participants=request.user).filter(participants=other_user).first()

        if not conversation:
            conversation = Conversation.objects.create()
            conversation.participants.add(request.user, other_user)

        serializer = self.get_serializer(conversation)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        conversation = self.get_object()
        messages = conversation.messages.filter(is_read=False).exclude(sender=request.user)
        messages.update(is_read=True)
        return Response({'detail': 'Messages marked as read'})

class MessageViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = MessageSerializer

    def get_queryset(self):
        conversation_id = self.request.query_params.get('conversation_id')
        if conversation_id:
            return Message.objects.filter(conversation_id=conversation_id)
        return Message.objects.none()

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

    @action(detail=False, methods=['post'])
    def send_message(self, request):
        conversation_id = request.data.get('conversation_id')
        content = request.data.get('content')

        if not conversation_id or not content:
            return Response({'detail': 'conversation_id and content are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            conversation = Conversation.objects.get(id=conversation_id, participants=request.user)
        except Conversation.DoesNotExist:
            return Response({'detail': 'Conversation not found'}, status=status.HTTP_404_NOT_FOUND)

        message = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            content=content
        )

        serializer = self.get_serializer(message)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class AnalyticsViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        user = request.user

        if user.role == 'client':
            stats = get_client_stats(user)
        elif user.role == 'freelancer':
            stats = get_freelancer_stats(user)
        elif user.role == 'consultant':
            stats = get_consultant_stats(user)
        else:
            stats = get_admin_stats()

        return Response({
            'role': user.role,
            'stats': stats
        })

    @action(detail=False, methods=['get'])
    def admin_stats(self, request):
        # Only admin users can access
        if not request.user.is_staff:
            return Response(
                {'detail': 'Only admin users can access this'},
                status=status.HTTP_403_FORBIDDEN
            )

        stats = get_admin_stats()
        growth = get_user_growth()

        return Response({
            'platform_stats': stats,
            'user_growth': growth
        })
