from rest_framework import serializers
from .models import Project, Proposal
from users.serializers import UserSerializer

class ProposalSerializer(serializers.ModelSerializer):
    freelancer = UserSerializer(read_only=True)

    class Meta:
        model = Proposal
        fields = ['id', 'project', 'freelancer', 'bid_amount', 'cover_letter', 'timeline', 'status', 'created_at']
        read_only_fields = ['id', 'created_at', 'freelancer']

class ProjectSerializer(serializers.ModelSerializer):
    client = UserSerializer(read_only=True)
    selected_freelancer = UserSerializer(read_only=True)
    proposals = ProposalSerializer(many=True, read_only=True)
    proposal_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = ['id', 'title', 'description', 'budget', 'budget_type', 'category', 'skills_required', 'duration', 'status', 'client', 'selected_freelancer', 'proposals', 'proposal_count', 'deadline', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'client', 'selected_freelancer']

    def get_proposal_count(self, obj):
        return obj.proposals.count()

class ProjectCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ['id', 'title', 'description', 'budget', 'budget_type', 'category', 'skills_required', 'duration', 'deadline', 'created_at']
        read_only_fields = ['id', 'created_at']
