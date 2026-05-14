from django.db import models
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import (
    ConsultantAvailability, ConsultationSession, Review,
    ConsultantPackage, RescheduleRequest, ConsultantSessionRate,
)
from .serializers import (
    ConsultantAvailabilitySerializer, ConsultationSessionSerializer,
    ConsultationSessionCreateSerializer, ReviewSerializer,
    ConsultantPackageSerializer, RescheduleRequestSerializer,
    ConsultantSessionRateSerializer,
)


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

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def available_slots(self, request):
        """Return available time windows for a consultant on a given date, excluding booked sessions."""
        import datetime
        consultant_id = request.query_params.get('consultant_id')
        date_str = request.query_params.get('date')
        if not consultant_id or not date_str:
            return Response({'detail': 'consultant_id and date are required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            target_date = datetime.date.fromisoformat(date_str)
        except ValueError:
            return Response({'detail': 'Invalid date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

        day_name = target_date.strftime('%A').lower()
        slots = ConsultantAvailability.objects.filter(
            consultant_id=consultant_id, day_of_week=day_name, is_available=True
        )

        booked = ConsultationSession.objects.filter(
            consultant_id=consultant_id,
            scheduled_date=target_date,
            status__in=['pending', 'awaiting_approval', 'confirmed', 'in_progress'],
        ).values('start_time', 'end_time', 'status')

        data = {
            'date': date_str,
            'day': day_name,
            'available_windows': ConsultantAvailabilitySerializer(slots, many=True).data,
            'booked_slots': list(booked),
        }
        return Response(data)


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

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data

        # Double-booking conflict check
        consultant = validated.get('consultant')
        scheduled_date = validated.get('scheduled_date')
        start_time = validated.get('start_time')
        end_time = validated.get('end_time')

        conflict = ConsultationSession.objects.filter(
            consultant=consultant,
            scheduled_date=scheduled_date,
            status__in=['pending', 'awaiting_approval', 'confirmed', 'in_progress'],
        ).exclude(end_time__lte=start_time).exclude(start_time__gte=end_time)

        if conflict.exists():
            return Response(
                {'detail': 'Time slot unavailable. Another session exists for this consultant at that time.'},
                status=status.HTTP_409_CONFLICT
            )

        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        client = self.request.user
        session = serializer.save(client=client, status='awaiting_approval')

        # Auto-create conversation between client and consultant
        from core.models import Conversation, Message, create_notification
        consultant = session.consultant
        existing = Conversation.objects.filter(participants=client).filter(participants=consultant)
        if existing.exists():
            conversation = existing.first()
        else:
            conversation = Conversation.objects.create()
            conversation.participants.add(client, consultant)

        # System message
        type_display = dict(ConsultationSession.SESSION_TYPE_CHOICES).get(session.session_type, session.session_type)
        client_name = client.get_full_name().strip() or client.username
        consultant_name = consultant.get_full_name().strip() or consultant.username
        Message.objects.create(
            conversation=conversation,
            sender=client,
            content=(
                f"Session Booking Confirmed\n"
                f"---------------------------\n"
                f"Session: {session.title}\n"
                f"Type: {type_display}\n"
                f"Date: {session.scheduled_date}\n"
                f"Time: {session.start_time} to {session.end_time}\n"
                f"Client: {client_name}\n"
                f"Consultant: {consultant_name}\n"
                f"---------------------------\n"
                f"Payment is secured in escrow. Use this chat to coordinate session details."
            )
        )

        # Notify consultant
        create_notification(
            consultant, 'session_booked',
            'New Booking Request 📅',
            f'{client.get_full_name() or client.username} booked a {type_display} session on {session.scheduled_date}.',
            related_id=session.id
        )

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def available_consultants(self, request):
        import datetime
        from django.contrib.auth import get_user_model
        from django.db.models import Q, Avg, Count, Case, When, FloatField, ExpressionWrapper, Value
        from django.db.models.functions import Coalesce
        from users.serializers import ConsultantListSerializer

        User = get_user_model()
        qs = User.objects.filter(role__in=['consultant', 'both']).prefetch_related(
            'skills', 'expertise_tags', 'consultation_availability',
            'consultation_sessions_as_consultant',
        )

        search = request.query_params.get('search', '').strip()
        online = request.query_params.get('online', '')
        available_today = request.query_params.get('available_today', '')
        min_rate = request.query_params.get('min_rate', '')
        max_rate = request.query_params.get('max_rate', '')
        language = request.query_params.get('language', '').strip()
        session_type = request.query_params.get('session_type', '').strip()
        min_rating = request.query_params.get('min_rating', '')
        experience_min = request.query_params.get('experience_min', '')

        if search:
            qs = qs.filter(
                Q(username__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(skills__name__icontains=search) |
                Q(expertise_tags__tag__icontains=search) |
                Q(working_industry__icontains=search) |
                Q(bio__icontains=search) |
                Q(headline__icontains=search)
            ).distinct()

        if online == 'true':
            qs = qs.filter(is_online=True)

        if available_today == 'true':
            today = datetime.date.today().strftime('%A').lower()
            qs = qs.filter(
                consultation_availability__day_of_week=today,
                consultation_availability__is_available=True,
            ).distinct()

        if min_rate:
            try:
                qs = qs.filter(hourly_rate__gte=float(min_rate))
            except ValueError:
                pass

        if max_rate:
            try:
                qs = qs.filter(hourly_rate__lte=float(max_rate))
            except ValueError:
                pass

        if language:
            qs = qs.filter(languages__icontains=language)

        if session_type:
            qs = qs.filter(packages__session_type=session_type, packages__is_active=True).distinct()

        if experience_min:
            try:
                qs = qs.filter(years_of_experience__gte=int(experience_min))
            except ValueError:
                pass

        # Smart ranking annotation
        qs = qs.annotate(
            avg_r=Coalesce(
                Avg('consultation_sessions_as_consultant__review__rating'),
                Value(0.0),
                output_field=FloatField()
            ),
            total_s=Count(
                'consultation_sessions_as_consultant',
                filter=Q(consultation_sessions_as_consultant__status='completed')
            ),
        ).annotate(
            rank_score=ExpressionWrapper(
                Coalesce('avg_r', Value(0.0)) * 20.0
                + Coalesce('total_s', Value(0)) * 0.5
                + Case(When(is_featured=True, then=Value(30.0)), default=Value(0.0), output_field=FloatField())
                + Case(When(kyc_status='verified', then=Value(20.0)), default=Value(0.0), output_field=FloatField())
                + Case(When(is_online=True, then=Value(10.0)), default=Value(0.0), output_field=FloatField()),
                output_field=FloatField()
            )
        )

        if min_rating:
            try:
                qs = qs.filter(avg_r__gte=float(min_rating))
            except ValueError:
                pass

        qs = qs.order_by('-rank_score')
        serializer = ConsultantListSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def confirm_session(self, request, pk=None):
        session = self.get_object()
        if session.consultant != request.user:
            return Response({'detail': 'Only consultant can confirm session'}, status=status.HTTP_403_FORBIDDEN)
        session.status = 'confirmed'
        session.save()
        from core.models import create_notification, Conversation, Message
        consultant_name = request.user.get_full_name().strip() or request.user.username
        client_name = session.client.get_full_name().strip() or session.client.username
        type_display = dict(ConsultationSession.SESSION_TYPE_CHOICES).get(session.session_type, session.session_type)
        existing = Conversation.objects.filter(participants=request.user).filter(participants=session.client)
        if existing.exists():
            conversation = existing.first()
            Message.objects.create(
                conversation=conversation,
                sender=request.user,
                content=(
                    f"Session Approved\n"
                    f"---------------------------\n"
                    f"Session: {session.title}\n"
                    f"Type: {type_display}\n"
                    f"Date: {session.scheduled_date}\n"
                    f"Time: {session.start_time} to {session.end_time}\n"
                    f"Client: {client_name}\n"
                    f"Consultant: {consultant_name}\n"
                    f"---------------------------\n"
                    f"Session confirmed. Funds are secured in escrow. Share meeting link or any details here."
                )
            )
        create_notification(
            session.client, 'session_confirmed',
            'Session Confirmed ✅',
            f'{session.consultant.username} confirmed your session on {session.scheduled_date}.',
            related_id=session.id
        )
        return Response({'detail': 'Session confirmed'})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def decline_session(self, request, pk=None):
        session = self.get_object()
        if session.consultant != request.user:
            return Response({'detail': 'Only consultant can decline session'}, status=status.HTTP_403_FORBIDDEN)
        if session.status not in ('awaiting_approval', 'pending'):
            return Response({'detail': 'Session cannot be declined in current state'}, status=status.HTTP_400_BAD_REQUEST)
        reason = request.data.get('reason', '').strip()
        session.status = 'cancelled'
        session.save()
        from core.models import create_notification
        message = f'{session.consultant.username} declined your session request for {session.scheduled_date}.'
        if reason:
            message += f' Reason: {reason}'
        create_notification(
            session.client, 'session_cancelled',
            'Session Request Declined ❌',
            message,
            related_id=session.id
        )
        return Response({'detail': 'Session declined'})

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
            f'Your session on {session.scheduled_date} was cancelled.',
            related_id=session.id
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
            f'Your session with {session.consultant.username} is complete. Leave a review!',
            related_id=session.id
        )
        return Response({'detail': 'Session completed'})

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_sessions(self, request):
        sessions = ConsultationSession.objects.filter(
            models.Q(consultant=request.user) | models.Q(client=request.user)
        )
        serializer = self.get_serializer(sessions, many=True)
        return Response(serializer.data)


class ConsultantPackageViewSet(viewsets.ModelViewSet):
    serializer_class = ConsultantPackageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ConsultantPackage.objects.filter(consultant=self.request.user)

    def perform_create(self, serializer):
        serializer.save(consultant=self.request.user)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_packages(self, request):
        packages = ConsultantPackage.objects.filter(consultant=request.user)
        serializer = self.get_serializer(packages, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def consultant_packages(self, request):
        consultant_id = request.query_params.get('consultant_id')
        if not consultant_id:
            return Response({'detail': 'consultant_id required'}, status=status.HTTP_400_BAD_REQUEST)
        packages = ConsultantPackage.objects.filter(consultant_id=consultant_id, is_active=True)
        serializer = self.get_serializer(packages, many=True)
        return Response(serializer.data)


class ConsultantSessionRateViewSet(viewsets.ModelViewSet):
    serializer_class = ConsultantSessionRateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ConsultantSessionRate.objects.filter(consultant=self.request.user)

    def perform_create(self, serializer):
        serializer.save(consultant=self.request.user)

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def consultant_rates(self, request):
        consultant_id = request.query_params.get('consultant_id')
        if not consultant_id:
            return Response({'detail': 'consultant_id required'}, status=status.HTTP_400_BAD_REQUEST)
        rates = ConsultantSessionRate.objects.filter(consultant_id=consultant_id, is_active=True)
        serializer = self.get_serializer(rates, many=True)
        return Response(serializer.data)


class RescheduleRequestViewSet(viewsets.ModelViewSet):
    serializer_class = RescheduleRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return RescheduleRequest.objects.filter(
            models.Q(session__client=user) | models.Q(session__consultant=user)
        )

    def perform_create(self, serializer):
        user = self.request.user
        req = serializer.save(requested_by=user)
        session = req.session

        # Mark session as reschedule_requested
        session.status = 'reschedule_requested'
        session.save()

        from core.models import create_notification
        other = session.consultant if user == session.client else session.client
        create_notification(
            other, 'reschedule_requested',
            'Reschedule Requested 🔄',
            f'A reschedule request was made for session: {session.title} (originally {session.scheduled_date}).',
            related_id=session.id
        )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def respond(self, request, pk=None):
        req = self.get_object()
        user = request.user
        session = req.session

        # Only the other party can respond
        if req.requested_by == user:
            return Response({'detail': 'Cannot respond to your own reschedule request.'}, status=status.HTTP_403_FORBIDDEN)

        response_action = request.data.get('action')  # 'approve', 'reject', 'counter'
        if response_action not in ('approve', 'reject', 'counter'):
            return Response({'detail': "action must be 'approve', 'reject', or 'counter'."}, status=status.HTTP_400_BAD_REQUEST)

        from core.models import create_notification

        if response_action == 'approve':
            req.status = 'approved'
            req.save()
            session.scheduled_date = req.new_date
            session.start_time = req.new_start_time
            session.end_time = req.new_end_time
            session.status = 'rescheduled'
            session.save()
            create_notification(
                req.requested_by, 'reschedule_responded',
                'Reschedule Approved ✅',
                f'Your reschedule request for "{session.title}" was approved. New date: {req.new_date}.',
                related_id=session.id
            )

        elif response_action == 'reject':
            req.status = 'rejected'
            req.save()
            session.status = 'confirmed'
            session.save()
            create_notification(
                req.requested_by, 'reschedule_responded',
                'Reschedule Rejected ❌',
                f'Your reschedule request for "{session.title}" was rejected. Original slot remains.',
                related_id=session.id
            )

        elif response_action == 'counter':
            new_date = request.data.get('new_date')
            new_start = request.data.get('new_start_time')
            new_end = request.data.get('new_end_time')
            counter_message = request.data.get('message', '')
            if not all([new_date, new_start, new_end]):
                return Response({'detail': 'new_date, new_start_time, new_end_time required for counter.'}, status=status.HTTP_400_BAD_REQUEST)
            req.status = 'counter'
            req.save()
            counter = RescheduleRequest.objects.create(
                session=session,
                requested_by=user,
                new_date=new_date,
                new_start_time=new_start,
                new_end_time=new_end,
                message=counter_message,
            )
            create_notification(
                req.requested_by, 'reschedule_responded',
                'Counter Proposal ↔️',
                f'A counter reschedule was proposed for "{session.title}". New date: {new_date}.',
                related_id=session.id
            )
            return Response(RescheduleRequestSerializer(counter).data)

        return Response({'detail': f'Reschedule {response_action}d.', 'session_status': session.status})


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
            f'{user.username} left you a {serializer.validated_data.get("rating", "")}-star review.',
            related_id=session.id
        )
