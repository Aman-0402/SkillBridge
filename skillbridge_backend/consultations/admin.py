from django.contrib import admin
from .models import ConsultantAvailability, ConsultationSession, Review

@admin.register(ConsultantAvailability)
class ConsultantAvailabilityAdmin(admin.ModelAdmin):
    list_display = ['consultant', 'day_of_week', 'start_time', 'end_time', 'is_available']
    list_filter = ['day_of_week', 'is_available']
    search_fields = ['consultant__username']

@admin.register(ConsultationSession)
class ConsultationSessionAdmin(admin.ModelAdmin):
    list_display = ['consultant', 'client', 'session_type', 'scheduled_date', 'status']
    list_filter = ['status', 'session_type', 'scheduled_date']
    search_fields = ['consultant__username', 'client__username', 'title']

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['session', 'reviewer', 'rating', 'created_at']
    list_filter = ['rating', 'created_at']
    search_fields = ['reviewer__username', 'session__consultant__username']
