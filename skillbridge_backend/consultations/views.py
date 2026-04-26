from django.db import models
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import ConsultantAvailability, ConsultationSession, Review
from .serializers import ConsultantAvailabilitySerializer, ConsultationSessionSerializer, ConsultationSessionCreateSerializer, ReviewSerializer

class ConsultantAvailabilityViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ConsultantAvailability.objects.filter(consultant=self.request.user)

    def get_serializer_class(self):
        return ConsultantAvailabilitySerializer

    def perform_create(self, serializer):
        serializer.save(consultant=self.request.user)

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def consultant_availability(self, request):
        consultant_id = request.query_params.get('consultant_id')
        if not consultant_id:
            return Response({'detail': 'consultant_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        availability = ConsultantAvailability.objects.filter(consultant_id=consultant_id, is_available=True)
        serializer = self.get_serializer(availability, many=True)
        return Response(serializer.data)

class ConsultationSessionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['scheduled_date']

    def get_queryset(self):
        user = self.request.user
        return ConsultationSession.objects.filter(
            models.Q(consultant=user) | models.Q(client=user)
        )

    def get_serializer_class(self):
        if self.action == 'create':
            return ConsultationSessionCreateSerializer
        return ConsultationSessionSerializer

    def perform_create(self, serializer):
        serializer.save(client=self.request.user)

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def available_consultants(self, request):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        consultants = User.objects.filter(role='consultant')
        from users.serializers import UserSerializer
        serializer = UserSerializer(consultants, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def confirm_session(self, request, pk=None):
        session = self.get_object()
        if session.consultant != request.user:
            return Response({'detail': 'Only consultant can confirm session'}, status=status.HTTP_403_FORBIDDEN)

        session.status = 'confirmed'
        session.save()
        return Response({'detail': 'Session confirmed'})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def cancel_session(self, request, pk=None):
        session = self.get_object()
        if session.consultant != request.user and session.client != request.user:
            return Response({'detail': 'Only consultant or client can cancel session'}, status=status.HTTP_403_FORBIDDEN)

        session.status = 'cancelled'
        session.save()
        return Response({'detail': 'Session cancelled'})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def complete_session(self, request, pk=None):
        session = self.get_object()
        if session.consultant != request.user:
            return Response({'detail': 'Only consultant can complete session'}, status=status.HTTP_403_FORBIDDEN)

        session.status = 'completed'
        session.save()
        return Response({'detail': 'Session completed'})

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_sessions(self, request):
        sessions = ConsultationSession.objects.filter(
            models.Q(consultant=request.user) | models.Q(client=request.user)
        )
        serializer = self.get_serializer(sessions, many=True)
        return Response(serializer.data)

class ReviewViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Review.objects.all()

    def get_serializer_class(self):
        return ReviewSerializer

    def perform_create(self, serializer):
        serializer.save(reviewer=self.request.user)
