from django.contrib import admin
from .models import Job, JobApplication

@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ['title', 'company', 'posted_by', 'status', 'created_at']
    list_filter = ['status', 'job_type', 'experience_level', 'created_at']
    search_fields = ['title', 'description', 'company', 'posted_by__username']

@admin.register(JobApplication)
class JobApplicationAdmin(admin.ModelAdmin):
    list_display = ['job', 'applicant', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['job__title', 'applicant__username']
