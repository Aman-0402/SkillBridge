from django.db.models import Count, Sum, Avg, Q
from django.utils import timezone
from datetime import timedelta
from projects.models import Project, Proposal
from jobs.models import Job, JobApplication
from consultations.models import ConsultationSession
from proposals.models import Payment
from django.contrib.auth import get_user_model

User = get_user_model()

def get_client_stats(user):
    """Get statistics for client users"""
    projects = Project.objects.filter(client=user)
    now = timezone.now()
    last_30_days = now - timedelta(days=30)

    return {
        'total_projects': projects.count(),
        'active_projects': projects.filter(status__in=['open', 'in_progress']).count(),
        'completed_projects': projects.filter(status='completed').count(),
        'total_spent': Payment.objects.filter(
            proposal__project__client=user,
            status='completed'
        ).aggregate(Sum('amount'))['amount__sum'] or 0,
        'projects_this_month': projects.filter(created_at__gte=last_30_days).count(),
        'total_proposals': Proposal.objects.filter(project__client=user).count(),
        'active_proposals': Proposal.objects.filter(
            project__client=user,
            status='submitted'
        ).count(),
        'avg_project_budget': projects.aggregate(Avg('budget'))['budget__avg'] or 0,
    }

def get_freelancer_stats(user):
    """Get statistics for freelancer users"""
    proposals = Proposal.objects.filter(freelancer=user)
    now = timezone.now()
    last_30_days = now - timedelta(days=30)

    completed_proposals = proposals.filter(status='accepted')
    completed_projects = Project.objects.filter(
        selected_freelancer=user,
        status='completed'
    )

    return {
        'total_proposals': proposals.count(),
        'accepted_proposals': completed_proposals.count(),
        'pending_proposals': proposals.filter(status='submitted').count(),
        'total_earned': Payment.objects.filter(
            proposal__freelancer=user,
            status='completed'
        ).aggregate(Sum('amount'))['amount__sum'] or 0,
        'proposals_this_month': proposals.filter(created_at__gte=last_30_days).count(),
        'completed_projects': completed_projects.count(),
        'avg_bid_amount': proposals.aggregate(Avg('bid_amount'))['bid_amount__avg'] or 0,
        'success_rate': round(
            (completed_proposals.count() / proposals.count() * 100) if proposals.count() > 0 else 0,
            2
        ),
    }

def get_consultant_stats(user):
    """Get statistics for consultant users"""
    sessions = ConsultationSession.objects.filter(consultant=user)
    now = timezone.now()
    last_30_days = now - timedelta(days=30)

    completed_sessions = sessions.filter(status='completed')

    return {
        'total_sessions': sessions.count(),
        'completed_sessions': completed_sessions.count(),
        'confirmed_sessions': sessions.filter(status='confirmed').count(),
        'pending_sessions': sessions.filter(status='pending').count(),
        'total_earned': sum(
            s.session_cost for s in completed_sessions
        ),
        'sessions_this_month': sessions.filter(created_at__gte=last_30_days).count(),
        'avg_session_cost': sessions.aggregate(Avg('session_cost'))['session_cost__avg'] or 0,
        'total_clients': sessions.values('client').distinct().count(),
    }

def get_admin_stats():
    """Get statistics for admin/platform"""
    return {
        'total_users': User.objects.count(),
        'clients': User.objects.filter(role='client').count(),
        'freelancers': User.objects.filter(role='freelancer').count(),
        'consultants': User.objects.filter(role='consultant').count(),
        'total_projects': Project.objects.count(),
        'active_projects': Project.objects.filter(status__in=['open', 'in_progress']).count(),
        'completed_projects': Project.objects.filter(status='completed').count(),
        'total_jobs': Job.objects.count(),
        'active_jobs': Job.objects.filter(status='open').count(),
        'total_payments': Payment.objects.filter(status='completed').aggregate(Sum('amount'))['amount__sum'] or 0,
        'total_transactions': Payment.objects.filter(status='completed').count(),
        'avg_project_budget': Project.objects.aggregate(Avg('budget'))['budget__avg'] or 0,
        'platform_earnings': Payment.objects.filter(status='completed').aggregate(Sum('amount'))['amount__sum'] or 0,
    }

def get_user_growth():
    """Get user growth statistics"""
    now = timezone.now()
    last_30_days = now - timedelta(days=30)

    return {
        'new_users_this_month': User.objects.filter(date_joined__gte=last_30_days).count(),
        'new_users_this_week': User.objects.filter(
            date_joined__gte=now - timedelta(days=7)
        ).count(),
        'by_role': {
            'clients': User.objects.filter(role='client', date_joined__gte=last_30_days).count(),
            'freelancers': User.objects.filter(role='freelancer', date_joined__gte=last_30_days).count(),
            'consultants': User.objects.filter(role='consultant', date_joined__gte=last_30_days).count(),
        }
    }

def get_monthly_payments():
    """Get monthly payment statistics for last 12 months"""
    from django.db.models.functions import TruncMonth

    now = timezone.now()
    last_12_months = now - timedelta(days=365)

    monthly_data = Payment.objects.filter(
        status='completed',
        created_at__gte=last_12_months
    ).annotate(
        month=TruncMonth('created_at')
    ).values('month').annotate(
        total=Sum('amount')
    ).order_by('month')

    # Format data for chart
    chart_data = []
    for item in monthly_data:
        if item['month']:
            month_str = item['month'].strftime('%b %Y')
            chart_data.append({
                'month': month_str,
                'amount': float(item['total'] or 0)
            })

    # Fill missing months with 0
    if not chart_data:
        # Return last 12 months even if no data
        for i in range(12):
            date = now - timedelta(days=30*i)
            month_str = date.strftime('%b %Y')
            chart_data.insert(0, {'month': month_str, 'amount': 0})

    return chart_data

def get_user_growth_chart():
    """Get user growth statistics for last 12 months"""
    from django.db.models.functions import TruncWeek

    now = timezone.now()
    last_12_months = now - timedelta(days=365)

    weekly_data = User.objects.filter(
        date_joined__gte=last_12_months
    ).annotate(
        week=TruncWeek('date_joined')
    ).values('week').annotate(
        count=Count('id')
    ).order_by('week')

    # Format data for chart
    chart_data = []
    cumulative_count = 0

    for item in weekly_data:
        if item['week']:
            week_str = item['week'].strftime('%b %d')
            cumulative_count += item['count']
            chart_data.append({
                'week': week_str,
                'new_users': item['count'],
                'total_users': User.objects.filter(date_joined__lte=item['week']).count()
            })

    return chart_data

def get_recent_transactions():
    """Get recent completed transactions"""
    transactions = Payment.objects.filter(
        status='completed'
    ).select_related('proposal__freelancer', 'proposal__project__client').order_by('-created_at')[:20]

    activity_data = []
    for transaction in transactions:
        activity_data.append({
            'id': transaction.id,
            'amount': float(transaction.amount),
            'date': transaction.created_at.strftime('%b %d, %Y'),
            'time': transaction.created_at.strftime('%I:%M %p'),
            'freelancer': transaction.proposal.freelancer.username if transaction.proposal.freelancer else 'Unknown',
            'project': transaction.proposal.project.title if transaction.proposal.project else 'Unknown',
            'client': transaction.proposal.project.client.username if transaction.proposal.project else 'Unknown',
            'status': transaction.status
        })

    return activity_data
