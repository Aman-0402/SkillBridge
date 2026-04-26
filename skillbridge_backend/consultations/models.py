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

    class Meta:
        unique_together = ('consultant', 'day_of_week', 'start_time', 'end_time')
        ordering = ['day_of_week', 'start_time']

    def __str__(self):
        return f"{self.consultant.username} - {self.day_of_week} {self.start_time}-{self.end_time}"


class ConsultationSession(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
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


class Review(models.Model):
    session = models.OneToOneField(ConsultationSession, on_delete=models.CASCADE, related_name='review')
    reviewer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews_given')
    rating = models.IntegerField(choices=[(i, str(i)) for i in range(1, 6)])
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Review for {self.session}"
