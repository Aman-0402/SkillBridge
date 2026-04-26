from rest_framework import serializers
from .models import ConsultantAvailability, ConsultationSession, Review
from users.serializers import UserSerializer

class ConsultantAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = ConsultantAvailability
        fields = ['id', 'day_of_week', 'start_time', 'end_time', 'is_available']

class ReviewSerializer(serializers.ModelSerializer):
    reviewer = UserSerializer(read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'reviewer', 'rating', 'comment', 'created_at']
        read_only_fields = ['id', 'created_at', 'reviewer']

class ConsultationSessionSerializer(serializers.ModelSerializer):
    consultant = UserSerializer(read_only=True)
    client = UserSerializer(read_only=True)
    review = ReviewSerializer(read_only=True)

    class Meta:
        model = ConsultationSession
        fields = ['id', 'consultant', 'client', 'session_type', 'title', 'description', 'scheduled_date', 'start_time', 'end_time', 'session_cost', 'status', 'notes', 'meeting_link', 'review', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'consultant', 'client']

class ConsultationSessionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConsultationSession
        fields = ['consultant', 'session_type', 'title', 'description', 'scheduled_date', 'start_time', 'end_time', 'session_cost']
