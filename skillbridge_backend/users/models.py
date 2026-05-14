from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ('client', 'Client'),
        ('freelancer', 'Freelancer'),
        ('consultant', 'Consultant'),
        ('both', 'Both (Freelancer + Consultant)'),
        ('admin', 'Admin'),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='freelancer')
    is_premium = models.BooleanField(default=False)
    bio = models.TextField(blank=True, null=True)
    profile_image = models.ImageField(upload_to='profiles/', blank=True, null=True)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    verification_token = models.CharField(max_length=255, blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    portfolio_url = models.URLField(blank=True, null=True)

    # Contact & location
    phone = models.CharField(max_length=15, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)

    # Identity type (differs per role — e.g. Enterprise/MSME for client; Consultant/Trainer for freelancer)
    identity = models.CharField(max_length=50, blank=True, null=True)

    # Client-specific: areas of interest
    interest1 = models.CharField(max_length=100, blank=True, null=True)
    interest2 = models.CharField(max_length=100, blank=True, null=True)
    interest3 = models.CharField(max_length=100, blank=True, null=True)

    # Freelancer/Consultant-specific
    working_industry = models.CharField(max_length=100, blank=True, null=True)
    experience_description = models.TextField(blank=True, null=True)

    # KYC verification
    KYC_STATUS_CHOICES = (
        ('unverified', 'Unverified'),
        ('pending', 'Pending'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    )
    KYC_DOC_CHOICES = (
        ('aadhaar', 'Aadhaar Card'),
        ('pan', 'PAN Card'),
        ('passport', 'Passport'),
        ('driving_license', 'Driving License'),
        ('voter_id', 'Voter ID'),
    )
    kyc_status = models.CharField(max_length=20, choices=KYC_STATUS_CHOICES, default='unverified')
    kyc_document_type = models.CharField(max_length=20, choices=KYC_DOC_CHOICES, blank=True, null=True)
    kyc_document_number = models.CharField(max_length=50, blank=True, null=True)
    kyc_submitted_at = models.DateTimeField(blank=True, null=True)
    kyc_rejection_reason = models.TextField(blank=True, null=True)

    # Professional profile (consultant/freelancer)
    headline = models.CharField(max_length=255, blank=True, null=True)
    years_of_experience = models.PositiveIntegerField(null=True, blank=True)
    what_i_help_with = models.TextField(blank=True, null=True)
    ideal_client = models.TextField(blank=True, null=True)
    languages = models.CharField(max_length=255, blank=True, null=True)
    response_time_hours = models.IntegerField(default=24)
    preferred_communication = models.CharField(
        max_length=20, blank=True, null=True,
        choices=[('chat', 'Chat'), ('email', 'Email'), ('call', 'Call')]
    )

    # Social & external links
    linkedin_url = models.URLField(blank=True, null=True)
    twitter_url = models.URLField(blank=True, null=True)
    github_url = models.URLField(blank=True, null=True)
    website_url = models.URLField(blank=True, null=True)

    # Availability & presence
    timezone = models.CharField(max_length=50, default='Asia/Kolkata')
    is_online = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.username} ({self.role})"


class Skill(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='skills')
    name = models.CharField(max_length=100)
    proficiency = models.CharField(
        max_length=20,
        choices=[
            ('beginner', 'Beginner'),
            ('intermediate', 'Intermediate'),
            ('expert', 'Expert'),
        ],
        default='intermediate'
    )
    endorsed = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'name')
        indexes = [models.Index(fields=['name'])]

    def __str__(self):
        return f"{self.user.username} - {self.name}"


class ExpertiseTag(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='expertise_tags')
    tag = models.CharField(max_length=100)

    class Meta:
        unique_together = ('user', 'tag')
        indexes = [models.Index(fields=['tag'])]
        ordering = ['tag']

    def __str__(self):
        return f"{self.user.username} — {self.tag}"


class Experience(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='experiences')
    title = models.CharField(max_length=255)
    company = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    start_date = models.DateField()
    end_date = models.DateField(blank=True, null=True)
    is_current = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.user.username} - {self.title} at {self.company}"
