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

def get_both_stats(user):
    """Get merged statistics for users with both freelancer + consultant role"""
    f = get_freelancer_stats(user)
    c = get_consultant_stats(user)
    return {
        'total_proposals': f['total_proposals'],
        'accepted_proposals': f['accepted_proposals'],
        'pending_proposals': f['pending_proposals'],
        'freelancer_earned': f['total_earned'],
        'completed_projects': f['completed_projects'],
        'success_rate': f['success_rate'],
        'proposals_this_month': f['proposals_this_month'],
        'total_sessions': c['total_sessions'],
        'completed_sessions': c['completed_sessions'],
        'confirmed_sessions': c['confirmed_sessions'],
        'pending_sessions': c['pending_sessions'],
        'consultant_earned': c['total_earned'],
        'sessions_this_month': c['sessions_this_month'],
        'avg_session_cost': c['avg_session_cost'],
        'total_clients': c['total_clients'],
        'total_earned': float(f['total_earned'] or 0) + float(c['total_earned'] or 0),
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

def get_user_revenue_chart(user):
    """Monthly revenue for last 6 months — combines freelance payments + consulting sessions"""
    from django.db.models.functions import TruncMonth
    import datetime

    now = timezone.now()
    six_months_ago = now - timedelta(days=182)

    # Build month list
    months = []
    for i in range(5, -1, -1):
        d = now - timedelta(days=30 * i)
        months.append(d.replace(day=1, hour=0, minute=0, second=0, microsecond=0))

    # Freelance payments by month
    freelance_qs = Payment.objects.filter(
        proposal__freelancer=user,
        status='completed',
        created_at__gte=six_months_ago,
    ).annotate(month=TruncMonth('created_at')).values('month').annotate(total=Sum('amount'))
    freelance_map = {item['month'].replace(tzinfo=None): float(item['total'] or 0) for item in freelance_qs}

    # Consulting sessions by month (use scheduled_date)
    from consultations.models import ConsultationSession
    session_qs = ConsultationSession.objects.filter(
        consultant=user,
        status='completed',
        scheduled_date__gte=six_months_ago.date(),
    )
    consulting_map = {}
    for s in session_qs:
        key = s.scheduled_date.replace(day=1)
        key_dt = datetime.datetime(key.year, key.month, 1)
        consulting_map[key_dt] = consulting_map.get(key_dt, 0) + float(s.session_cost or 0)

    chart = []
    for m in months:
        key = m.replace(tzinfo=None)
        freelance = freelance_map.get(key, 0)
        consulting = consulting_map.get(key, 0)
        chart.append({
            'month': m.strftime('%b %Y'),
            'freelance': round(freelance, 2),
            'consulting': round(consulting, 2),
            'total': round(freelance + consulting, 2),
        })
    return chart

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

def get_kpi_metrics():
    """Get KPI metrics for admin dashboard"""
    now = timezone.now()
    last_30_days = now - timedelta(days=30)

    total_projects = Project.objects.count()
    completed_projects = Project.objects.filter(status='completed').count()
    total_proposals = Proposal.objects.count()
    accepted_proposals = Proposal.objects.filter(status='accepted').count()

    conversion_rate = round(
        (accepted_proposals / total_proposals * 100) if total_proposals > 0 else 0,
        2
    )

    avg_project_value = Project.objects.aggregate(Avg('budget'))['budget__avg'] or 0

    freelancers = User.objects.filter(role='freelancer')
    consultants = User.objects.filter(role='consultant')

    top_freelancers = []
    for freelancer in freelancers:
        earned = Payment.objects.filter(
            proposal__freelancer=freelancer,
            status='completed'
        ).aggregate(Sum('amount'))['amount__sum'] or 0
        if earned > 0:
            top_freelancers.append({
                'id': freelancer.id,
                'username': freelancer.username,
                'earned': float(earned),
                'projects_completed': Project.objects.filter(
                    selected_freelancer=freelancer,
                    status='completed'
                ).count()
            })

    top_freelancers = sorted(top_freelancers, key=lambda x: x['earned'], reverse=True)[:5]

    top_consultants = []
    for consultant in consultants:
        earned = ConsultationSession.objects.filter(
            consultant=consultant,
            status='completed'
        ).aggregate(Sum('session_cost'))['session_cost__sum'] or 0
        if earned > 0:
            top_consultants.append({
                'id': consultant.id,
                'username': consultant.username,
                'earned': float(earned),
                'sessions_completed': ConsultationSession.objects.filter(
                    consultant=consultant,
                    status='completed'
                ).count()
            })

    top_consultants = sorted(top_consultants, key=lambda x: x['earned'], reverse=True)[:5]

    total_revenue = Payment.objects.filter(status='completed').aggregate(Sum('amount'))['amount__sum'] or 0
    consultation_revenue = ConsultationSession.objects.filter(status='completed').aggregate(Sum('session_cost'))['session_cost__sum'] or 0
    project_revenue = total_revenue

    revenue_split = {
        'projects': float(project_revenue),
        'consultations': float(consultation_revenue),
        'total': float(project_revenue + consultation_revenue)
    }

    active_projects = Project.objects.filter(status__in=['open', 'in_progress']).count()
    total_users = User.objects.count()
    user_retention_rate = round(
        (User.objects.filter(last_login__gte=last_30_days).count() / total_users * 100) if total_users > 0 else 0,
        2
    )

    completed_this_month = Project.objects.filter(
        status='completed',
        completed_at__gte=last_30_days
    ).count() if hasattr(Project.objects.model, 'completed_at') else 0

    active_this_month = Project.objects.filter(
        status__in=['open', 'in_progress'],
        created_at__gte=last_30_days
    ).count()

    health_score = min(100, round(
        (user_retention_rate * 0.3 +
         (conversion_rate / 100 * 100) * 0.3 +
         (active_projects / max(total_projects, 1) * 100) * 0.2 +
         (accepted_proposals / max(total_proposals, 1) * 100) * 0.2),
        2
    ))

    return {
        'conversion_rate': conversion_rate,
        'avg_project_value': float(avg_project_value),
        'top_freelancers': top_freelancers,
        'top_consultants': top_consultants,
        'revenue_split': revenue_split,
        'platform_health_score': health_score,
        'metrics_summary': {
            'total_projects': total_projects,
            'completed_projects': completed_projects,
            'active_projects': active_projects,
            'total_proposals': total_proposals,
            'accepted_proposals': accepted_proposals,
            'total_users': total_users,
            'user_retention_rate': user_retention_rate,
            'completed_this_month': completed_this_month,
            'active_this_month': active_this_month,
        }
    }
