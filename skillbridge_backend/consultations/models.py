from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class ConsultantAvailability(models.Model):
    DAY_CHOICES = (
        ('monday', 'Monday'),
        ('tuesday', 'Tuesday'),
        ('wednesday', 'Wednesday'),
        ('thursday', 'Thursday'),
        ('friday', 'Friday'),
        ('saturday', 'Saturday'),
        ('sunday', 'Sunday'),
    )

    consultant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='consultation_availability')
    day_of_week = models.CharField(max_length=20, choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_available = models.BooleanField(default=True)
    buffer_minutes = models.PositiveIntegerField(default=0)
    max_bookings_per_slot = models.PositiveIntegerField(default=1)

    class Meta:
        unique_together = ('consultant', 'day_of_week', 'start_time', 'end_time')
        ordering = ['day_of_week', 'start_time']
        indexes = [models.Index(fields=['day_of_week', 'is_available'])]

    def __str__(self):
        return f"{self.consultant.username} - {self.day_of_week} {self.start_time}-{self.end_time}"


class ConsultationSession(models.Model):
    STATUS_CHOICES = (
        ('pending',              'Pending'),
        ('awaiting_approval',    'Awaiting Approval'),
        ('confirmed',            'Confirmed'),
        ('reschedule_requested', 'Reschedule Requested'),
        ('rescheduled',          'Rescheduled'),
        ('in_progress',          'In Progress'),
        ('completed',            'Completed'),
        ('under_review',         'Under Review'),
        ('payment_released',     'Payment Released'),
        ('cancelled',            'Cancelled'),
        ('refunded',             'Refunded'),
    )

    SESSION_TYPE_CHOICES = (
        ('call', 'Phone Call'),
        ('video', 'Video Call'),
        ('email', 'Email'),
        ('in_person', 'In Person'),
    )

    consultant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='consultation_sessions_as_consultant')
    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='consultation_sessions_as_client')
    session_type = models.CharField(max_length=20, choices=SESSION_TYPE_CHOICES)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    scheduled_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    session_cost = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True, null=True)
    meeting_link = models.URLField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-scheduled_date']

    def __str__(self):
        return f"{self.client.username} - {self.consultant.username} ({self.scheduled_date})"


class RescheduleRequest(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('counter', 'Counter Proposed'),
    )
    session        = models.ForeignKey(ConsultationSession, on_delete=models.CASCADE, related_name='reschedule_requests')
    requested_by   = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reschedule_requests_made')
    new_date       = models.DateField()
    new_start_time = models.TimeField()
    new_end_time   = models.TimeField()
    message        = models.TextField(blank=True)
    status         = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Reschedule for session {self.session_id} by {self.requested_by.username}"


class ConsultantPackage(models.Model):
    SESSION_TYPE_CHOICES = (
        ('call', 'Phone Call'),
        ('video', 'Video Call'),
        ('email', 'Email'),
        ('in_person', 'In Person'),
    )

    consultant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='packages')
    name = models.CharField(max_length=100)
    session_type = models.CharField(max_length=20, choices=SESSION_TYPE_CHOICES)
    duration_minutes = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['price']

    def __str__(self):
        return f"{self.consultant.username} — {self.name} ({self.duration_minutes}min)"


class ConsultantSessionRate(models.Model):
    SESSION_TYPE_CHOICES = ConsultationSession.SESSION_TYPE_CHOICES

    consultant   = models.ForeignKey(User, on_delete=models.CASCADE, related_name='session_rates')
    session_type = models.CharField(max_length=20, choices=SESSION_TYPE_CHOICES)
    hourly_rate  = models.DecimalField(max_digits=10, decimal_places=2)
    is_active    = models.BooleanField(default=True)

    class Meta:
        unique_together = ('consultant', 'session_type')
        ordering = ['session_type']

    def __str__(self):
        return f"{self.consultant.username} — {self.session_type} ₹{self.hourly_rate}/hr"


class Review(models.Model):
    session = models.OneToOneField(ConsultationSession, on_delete=models.CASCADE, related_name='review')
    reviewer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews_given')
    rating = models.IntegerField(choices=[(i, str(i)) for i in range(1, 6)])
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Review for {self.session}"
