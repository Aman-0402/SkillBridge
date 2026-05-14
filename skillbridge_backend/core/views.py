from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, BasePermission
from django.contrib.auth import get_user_model
from .models import Conversation, Message, Notification, Report
from .serializers import ConversationSerializer, ConversationListSerializer, MessageSerializer, NotificationSerializer
from .analytics import get_client_stats, get_freelancer_stats, get_consultant_stats, get_both_stats, get_admin_stats, get_user_growth, get_user_revenue_chart
from projects.models import Project, Proposal
from jobs.models import Job
from consultations.models import ConsultationSession
from proposals.models import Payment, Withdrawal
from proposals.serializers import WithdrawalSerializer

User = get_user_model()


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'admin' and request.user.is_staff

class ConversationViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ConversationSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin' and user.is_staff:
            return Conversation.objects.all()
        return Conversation.objects.filter(participants=user)

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
        elif user.role == 'both':
            stats = get_both_stats(user)
        else:
            stats = get_admin_stats()

        return Response({
            'role': user.role,
            'stats': stats
        })

    @action(detail=False, methods=['get'])
    def my_revenue_chart(self, request):
        user = request.user
        if user.role not in ('freelancer', 'consultant', 'both'):
            return Response({'detail': 'Not applicable for this role.'}, status=status.HTTP_403_FORBIDDEN)
        data = get_user_revenue_chart(user)
        return Response(data)

    @action(detail=False, methods=['get'])
    def admin_stats(self, request):
        # Only admin users can access
        if not request.user.is_staff or request.user.role != 'admin':
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

    @action(detail=False, methods=['get'])
    def monthly_payments(self, request):
        # Only admin users can access
        if not request.user.is_staff or request.user.role != 'admin':
            return Response(
                {'detail': 'Only admin users can access this'},
                status=status.HTTP_403_FORBIDDEN
            )

        from .analytics import get_monthly_payments
        data = get_monthly_payments()
        return Response(data)

    @action(detail=False, methods=['get'])
    def user_growth_chart(self, request):
        # Only admin users can access
        if not request.user.is_staff or request.user.role != 'admin':
            return Response(
                {'detail': 'Only admin users can access this'},
                status=status.HTTP_403_FORBIDDEN
            )

        from .analytics import get_user_growth_chart
        data = get_user_growth_chart()
        return Response(data)

    @action(detail=False, methods=['get'])
    def recent_transactions(self, request):
        # Only admin users can access
        if not request.user.is_staff or request.user.role != 'admin':
            return Response(
                {'detail': 'Only admin users can access this'},
                status=status.HTTP_403_FORBIDDEN
            )

        from .analytics import get_recent_transactions
        data = get_recent_transactions()
        return Response(data)

    @action(detail=False, methods=['get'])
    def kpis(self, request):
        if not request.user.is_staff or request.user.role != 'admin':
            return Response(
                {'detail': 'Only admin users can access this'},
                status=status.HTTP_403_FORBIDDEN
            )

        from .analytics import get_kpi_metrics
        data = get_kpi_metrics()
        return Response(data)


class AdminViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated, IsAdmin]

    @action(detail=False, methods=['get', 'post'])
    def users(self, request):
        if request.method == 'GET':
            search = request.query_params.get('search', '')
            role = request.query_params.get('role', '')

            users = User.objects.all()
            if search:
                users = users.filter(username__icontains=search) | users.filter(email__icontains=search)
            if role:
                users = users.filter(role=role)

            from users.serializers import UserSerializer
            serializer = UserSerializer(users, many=True)
            return Response(serializer.data)

        elif request.method == 'POST':
            from users.serializers import UserSerializer
            serializer = UserSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def user_detail(self, request, pk=None):
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({'detail': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        if request.method == 'GET':
            from users.serializers import UserSerializer
            serializer = UserSerializer(user)
            return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def projects(self, request):
        from django.db.models import Q
        search = request.query_params.get('search', '')
        status_filter = request.query_params.get('status', '')
        projects = Project.objects.all()
        if status_filter:
            projects = projects.filter(status=status_filter)
        if search:
            projects = projects.filter(
                Q(title__icontains=search) | Q(client__username__icontains=search) | Q(category__icontains=search)
            )

        data = [{
            'id': p.id,
            'title': p.title,
            'client': p.client.username,
            'budget': str(p.budget),
            'status': p.status,
            'created_at': p.created_at
        } for p in projects]
        return Response(data)

    @action(detail=False, methods=['get'])
    def proposals(self, request):
        from django.db.models import Q
        search = request.query_params.get('search', '')
        status_filter = request.query_params.get('status', '')
        proposals = Proposal.objects.all()
        if status_filter:
            proposals = proposals.filter(status=status_filter)
        if search:
            proposals = proposals.filter(
                Q(project__title__icontains=search) | Q(freelancer__username__icontains=search)
            )

        data = [{
            'id': p.id,
            'project': p.project.title,
            'freelancer': p.freelancer.username,
            'bid_amount': str(p.bid_amount),
            'status': p.status,
            'created_at': p.created_at
        } for p in proposals]
        return Response(data)

    @action(detail=False, methods=['get'])
    def payments(self, request):
        from django.db.models import Q
        search = request.query_params.get('search', '')
        status_filter = request.query_params.get('status', '')
        payments = Payment.objects.all()
        if status_filter:
            payments = payments.filter(status=status_filter)
        if search:
            payments = payments.filter(
                Q(proposal__project__title__icontains=search) | Q(proposal__freelancer__username__icontains=search)
            )

        data = [{
            'id': p.id,
            'amount': str(p.amount),
            'status': p.status,
            'freelancer': p.proposal.freelancer.username,
            'project': p.proposal.project.title,
            'created_at': p.created_at
        } for p in payments]
        return Response(data)

    @action(detail=False, methods=['get'])
    def jobs(self, request):
        from django.db.models import Q
        search = request.query_params.get('search', '')
        status_filter = request.query_params.get('status', '')
        jobs = Job.objects.all()
        if status_filter:
            jobs = jobs.filter(status=status_filter)
        if search:
            jobs = jobs.filter(
                Q(title__icontains=search) | Q(client__username__icontains=search) | Q(company__icontains=search)
            )

        data = [{
            'id': j.id,
            'title': j.title,
            'client': j.client.username,
            'budget': str(j.budget),
            'status': j.status,
            'created_at': j.created_at
        } for j in jobs]
        return Response(data)

    @action(detail=False, methods=['get'])
    def consultations(self, request):
        from django.db.models import Q
        search = request.query_params.get('search', '')
        status_filter = request.query_params.get('status', '')
        consultations = ConsultationSession.objects.all()
        if status_filter:
            consultations = consultations.filter(status=status_filter)
        if search:
            consultations = consultations.filter(
                Q(consultant__username__icontains=search) | Q(client__username__icontains=search)
            )

        data = [{
            'id': c.id,
            'consultant': c.consultant.username,
            'client': c.client.username,
            'session_cost': str(c.session_cost),
            'status': c.status,
            'created_at': c.created_at
        } for c in consultations]
        return Response(data)

    @action(detail=False, methods=['delete'])
    def delete_user(self, request):
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({'detail': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(id=user_id)
            user.delete()
            return Response({'detail': 'User deleted'}, status=status.HTTP_204_NO_CONTENT)
        except User.DoesNotExist:
            return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['delete'])
    def delete_project(self, request):
        project_id = request.query_params.get('project_id')
        if not project_id:
            return Response({'detail': 'project_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            project = Project.objects.get(id=project_id)
            project.delete()
            return Response({'detail': 'Project deleted'}, status=status.HTTP_204_NO_CONTENT)
        except Project.DoesNotExist:
            return Response({'detail': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['delete'])
    def delete_proposal(self, request):
        proposal_id = request.query_params.get('proposal_id')
        if not proposal_id:
            return Response({'detail': 'proposal_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            proposal = Proposal.objects.get(id=proposal_id)
            proposal.delete()
            return Response({'detail': 'Proposal deleted'}, status=status.HTTP_204_NO_CONTENT)
        except Proposal.DoesNotExist:
            return Response({'detail': 'Proposal not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['delete'])
    def delete_payment(self, request):
        payment_id = request.query_params.get('payment_id')
        if not payment_id:
            return Response({'detail': 'payment_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payment = Payment.objects.get(id=payment_id)
            payment.delete()
            return Response({'detail': 'Payment deleted'}, status=status.HTTP_204_NO_CONTENT)
        except Payment.DoesNotExist:
            return Response({'detail': 'Payment not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'])
    def withdrawals(self, request):
        withdrawals = Withdrawal.objects.all().order_by('-created_at')
        serializer = WithdrawalSerializer(withdrawals, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def approve_withdrawal(self, request):
        withdrawal_id = request.data.get('withdrawal_id')
        if not withdrawal_id:
            return Response({'detail': 'withdrawal_id required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            w = Withdrawal.objects.get(id=withdrawal_id)
        except Withdrawal.DoesNotExist:
            return Response({'detail': 'Withdrawal not found.'}, status=status.HTTP_404_NOT_FOUND)
        if w.status != 'pending':
            return Response({'detail': f'Already {w.status}.'}, status=status.HTTP_400_BAD_REQUEST)
        w.status = 'approved'
        w.save()
        return Response({'detail': 'Withdrawal approved.', 'status': 'approved'})

    @action(detail=False, methods=['post'])
    def reject_withdrawal(self, request):
        withdrawal_id = request.data.get('withdrawal_id')
        reason = request.data.get('reason', '')
        if not withdrawal_id:
            return Response({'detail': 'withdrawal_id required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            w = Withdrawal.objects.get(id=withdrawal_id)
        except Withdrawal.DoesNotExist:
            return Response({'detail': 'Withdrawal not found.'}, status=status.HTTP_404_NOT_FOUND)
        if w.status != 'pending':
            return Response({'detail': f'Already {w.status}.'}, status=status.HTTP_400_BAD_REQUEST)
        from proposals.models import EscrowWallet
        from decimal import Decimal
        wallet, _ = EscrowWallet.objects.get_or_create(user=w.user)
        wallet.balance += w.amount
        wallet.save()
        w.status = 'rejected'
        w.note = reason
        w.save()
        return Response({'detail': 'Withdrawal rejected. Balance restored.', 'status': 'rejected'})

    @action(detail=False, methods=['post'])
    def toggle_premium(self, request):
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'detail': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(id=user_id)
            user.is_premium = not user.is_premium
            user.save(update_fields=['is_premium'])
            return Response({'detail': f"Premium {'granted' if user.is_premium else 'revoked'}.", 'is_premium': user.is_premium})
        except User.DoesNotExist:
            return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


class NotificationViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def list_notifications(self, request):
        notifs = Notification.objects.filter(user=request.user)[:30]
        serializer = NotificationSerializer(notifs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({'count': count})

    @action(detail=False, methods=['post'])
    def mark_read(self, request):
        notif_id = request.data.get('id')
        if notif_id:
            Notification.objects.filter(id=notif_id, user=request.user).update(is_read=True)
        return Response({'detail': 'Marked read.'})

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'detail': 'All marked read.'})


class ReportViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def create(self, request):
        reported_id = request.data.get('reported_user')
        reason = request.data.get('reason')
        message = request.data.get('message', '').strip()

        if not reported_id or not reason:
            return Response({'detail': 'reported_user and reason required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not message:
            return Response({'detail': 'message required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            reported_user = User.objects.get(id=reported_id)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        if reported_user == request.user:
            return Response({'detail': 'Cannot report yourself.'}, status=status.HTTP_400_BAD_REQUEST)
        if reported_user.role == 'admin':
            return Response({'detail': 'Cannot report admin.'}, status=status.HTTP_400_BAD_REQUEST)

        report, created = Report.objects.get_or_create(
            reporter=request.user,
            reported_user=reported_user,
            defaults={'reason': reason, 'message': message},
        )
        if not created:
            return Response({'detail': 'You have already reported this user.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'detail': 'Report submitted. Our team will review it.'}, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def list_reports(self, request):
        if not request.user.is_staff:
            return Response({'detail': 'Admin only.'}, status=status.HTTP_403_FORBIDDEN)
        reports = Report.objects.select_related('reporter', 'reported_user').all()
        data = [{
            'id': r.id,
            'reporter': {'id': r.reporter.id, 'username': r.reporter.username, 'email': r.reporter.email},
            'reported_user': {'id': r.reported_user.id, 'username': r.reported_user.username, 'role': r.reported_user.role},
            'reason': r.reason,
            'message': r.message,
            'status': r.status,
            'admin_note': r.admin_note,
            'created_at': r.created_at.strftime('%b %d, %Y %I:%M %p'),
        } for r in reports]
        return Response(data)

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        if not request.user.is_staff:
            return Response({'detail': 'Admin only.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            report = Report.objects.get(pk=pk)
        except Report.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        new_status = request.data.get('status')
        admin_note = request.data.get('admin_note', report.admin_note)
        if new_status not in dict(Report.STATUS_CHOICES):
            return Response({'detail': 'Invalid status.'}, status=status.HTTP_400_BAD_REQUEST)
        report.status = new_status
        report.admin_note = admin_note
        report.save()
        return Response({'detail': 'Report updated.', 'status': report.status})
