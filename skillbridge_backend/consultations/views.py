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
        session = serializer.save(client=self.request.user)
        from core.models import create_notification
        create_notification(
            session.consultant, 'session_booked',
            'New Session Booked 📅',
            f'{self.request.user.username} booked a {session.session_type} session on {session.scheduled_date}.'
        )

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def available_consultants(self, request):
        import datetime
        from django.contrib.auth import get_user_model
        from django.db.models import Q
        from users.serializers import ConsultantListSerializer

        User = get_user_model()
        qs = User.objects.filter(role__in=['consultant', 'both']).prefetch_related(
            'skills', 'expertise_tags', 'consultation_availability',
            'consultation_sessions_as_consultant',
        )

        search = request.query_params.get('search', '').strip()
        online = request.query_params.get('online', '')
        available_today = request.query_params.get('available_today', '')

        if search:
            qs = qs.filter(
                Q(username__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(skills__name__icontains=search) |
                Q(expertise_tags__tag__icontains=search) |
                Q(working_industry__icontains=search) |
                Q(bio__icontains=search)
            ).distinct()

        if online == 'true':
            qs = qs.filter(is_online=True)

        if available_today == 'true':
            today = datetime.date.today().strftime('%A').lower()
            qs = qs.filter(
                consultation_availability__day_of_week=today,
                consultation_availability__is_available=True,
            ).distinct()

        serializer = ConsultantListSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def confirm_session(self, request, pk=None):
        session = self.get_object()
        if session.consultant != request.user:
            return Response({'detail': 'Only consultant can confirm session'}, status=status.HTTP_403_FORBIDDEN)

        session.status = 'confirmed'
        session.save()
        from core.models import create_notification
        create_notification(
            session.client, 'session_confirmed',
            'Session Confirmed ✅',
            f'{session.consultant.username} confirmed your session on {session.scheduled_date}.'
        )
        return Response({'detail': 'Session confirmed'})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def cancel_session(self, request, pk=None):
        session = self.get_object()
        if session.consultant != request.user and session.client != request.user:
            return Response({'detail': 'Only consultant or client can cancel session'}, status=status.HTTP_403_FORBIDDEN)

        session.status = 'cancelled'
        session.save()
        from core.models import create_notification
        other = session.client if session.consultant == request.user else session.consultant
        create_notification(
            other, 'session_cancelled',
            'Session Cancelled ❌',
            f'Your session on {session.scheduled_date} was cancelled.'
        )
        return Response({'detail': 'Session cancelled'})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def complete_session(self, request, pk=None):
        session = self.get_object()
        if session.consultant != request.user:
            return Response({'detail': 'Only consultant can complete session'}, status=status.HTTP_403_FORBIDDEN)

        session.status = 'completed'
        session.save()
        from core.models import create_notification
        create_notification(
            session.client, 'session_completed',
            'Session Completed 🎉',
            f'Your session with {session.consultant.username} is complete. Leave a review!'
        )
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
        session = serializer.validated_data['session']
        user = self.request.user
        if session.status != 'completed':
            from rest_framework.exceptions import ValidationError
            raise ValidationError('Can only review completed sessions.')
        if session.client != user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Only the client of this session can leave a review.')
        if hasattr(session, 'review'):
            from rest_framework.exceptions import ValidationError
            raise ValidationError('Review already submitted for this session.')
        serializer.save(reviewer=user)
        from core.models import create_notification
        create_notification(
            session.consultant, 'review_received',
            'New Review ⭐',
            f'{user.username} left you a {serializer.validated_data.get("rating", "")}-star review.'
        )
