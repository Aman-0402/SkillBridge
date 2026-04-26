from rest_framework import serializers
from .models import Job, JobApplication
from users.serializers import UserSerializer

class JobApplicationSerializer(serializers.ModelSerializer):
    applicant = UserSerializer(read_only=True)

    class Meta:
        model = JobApplication
        fields = ['id', 'job', 'applicant', 'resume', 'cover_letter', 'status', 'rating', 'created_at']
        read_only_fields = ['id', 'created_at', 'applicant']

class JobSerializer(serializers.ModelSerializer):
    posted_by = UserSerializer(read_only=True)
    selected_candidate = UserSerializer(read_only=True)
    applications = JobApplicationSerializer(many=True, read_only=True)
    application_count = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = ['id', 'title', 'description', 'company', 'location', 'job_type', 'salary_min', 'salary_max', 'category', 'skills_required', 'experience_level', 'status', 'posted_by', 'selected_candidate', 'applications', 'application_count', 'deadline', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'posted_by', 'selected_candidate']

    def get_application_count(self, obj):
        return obj.applications.count()

class JobCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = ['title', 'description', 'company', 'location', 'job_type', 'salary_min', 'salary_max', 'category', 'skills_required', 'experience_level', 'deadline']
