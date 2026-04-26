from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Project(models.Model):
    STATUS_CHOICES = (
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )

    title = models.CharField(max_length=255)
    description = models.TextField()
    budget = models.DecimalField(max_digits=10, decimal_places=2)
    budget_type = models.CharField(
        max_length=20,
        choices=[
            ('fixed', 'Fixed Price'),
            ('hourly', 'Hourly'),
        ],
        default='fixed'
    )
    category = models.CharField(max_length=100)
    skills_required = models.CharField(max_length=255, blank=True)
    duration = models.CharField(
        max_length=50,
        choices=[
            ('less_than_month', 'Less than a month'),
            ('1_3_months', '1 to 3 months'),
            ('3_6_months', '3 to 6 months'),
            ('more_than_6_months', 'More than 6 months'),
        ]
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='projects')
    selected_freelancer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_projects')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deadline = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class Proposal(models.Model):
    STATUS_CHOICES = (
        ('submitted', 'Submitted'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('withdrawn', 'Withdrawn'),
    )

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='proposals')
    freelancer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='proposals')
    bid_amount = models.DecimalField(max_digits=10, decimal_places=2)
    cover_letter = models.TextField()
    timeline = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='submitted')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('project', 'freelancer')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.freelancer.username} - {self.project.title}"
