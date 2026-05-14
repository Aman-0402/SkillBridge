from rest_framework import serializers
from .models import User, Skill, Experience, ExpertiseTag

class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ['id', 'name', 'proficiency', 'endorsed', 'created_at']
        read_only_fields = ['id', 'created_at']

class ExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Experience
        fields = ['id', 'title', 'company', 'description', 'start_date', 'end_date', 'is_current', 'created_at']
        read_only_fields = ['id', 'created_at']

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'bio', 'profile_image', 'hourly_rate', 'is_verified', 'is_featured', 'is_premium', 'is_staff', 'identity', 'working_industry', 'state', 'kyc_status']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)
    full_name = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password2', 'role',
            'full_name', 'phone', 'state', 'identity',
            'interest1', 'interest2', 'interest3',
            'working_industry', 'experience_description',
        ]
        extra_kwargs = {
            'role': {'required': False},
            'phone': {'required': False, 'allow_blank': True, 'allow_null': True},
            'state': {'required': False, 'allow_blank': True, 'allow_null': True},
            'identity': {'required': False, 'allow_blank': True, 'allow_null': True},
            'interest1': {'required': False, 'allow_blank': True, 'allow_null': True},
            'interest2': {'required': False, 'allow_blank': True, 'allow_null': True},
            'interest3': {'required': False, 'allow_blank': True, 'allow_null': True},
            'working_industry': {'required': False, 'allow_blank': True, 'allow_null': True},
            'experience_description': {'required': False, 'allow_blank': True, 'allow_null': True},
        }

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password2": "Passwords don't match."})
        return data

    def create(self, validated_data):
        full_name = validated_data.pop('full_name', '')
        validated_data.pop('password2')

        first_name, *rest = full_name.strip().split(' ') if full_name.strip() else ('', [])
        last_name = ' '.join(rest)

        user = User.objects.create_user(
            username=validated_data.pop('username'),
            email=validated_data.pop('email'),
            password=validated_data.pop('password'),
            role=validated_data.pop('role', 'freelancer'),
            first_name=first_name,
            last_name=last_name,
            **validated_data,
        )
        return user

class ProfileSerializer(serializers.ModelSerializer):
    profile_completion_pct = serializers.SerializerMethodField()

    def get_profile_completion_pct(self, obj):
        score = 0
        if obj.profile_image:
            score += 10
        if obj.bio:
            score += 10
        if obj.headline:
            score += 5
        if obj.location:
            score += 5
        if obj.hourly_rate:
            score += 10
        if obj.skills.exists():
            score += 10
        if obj.expertise_tags.exists():
            score += 10
        if obj.kyc_status == 'verified':
            score += 20
        if obj.what_i_help_with:
            score += 5
        if obj.linkedin_url or obj.portfolio_url:
            score += 5
        if obj.consultation_availability.exists():
            score += 5
        if obj.packages.filter(is_active=True).exists():
            score += 5
        return score

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'role',
            'bio', 'profile_image', 'hourly_rate', 'is_verified', 'is_staff',
            'phone', 'state', 'identity',
            'interest1', 'interest2', 'interest3',
            'working_industry', 'experience_description',
            'location', 'portfolio_url',
            'kyc_status', 'kyc_document_type', 'kyc_document_number',
            'kyc_submitted_at', 'kyc_rejection_reason',
            'timezone', 'is_online', 'is_premium',
            # New professional fields
            'headline', 'years_of_experience', 'what_i_help_with', 'ideal_client',
            'languages', 'response_time_hours', 'preferred_communication',
            'linkedin_url', 'twitter_url', 'github_url', 'website_url',
            'profile_completion_pct',
        ]
        read_only_fields = [
            'id', 'username', 'email', 'is_verified', 'is_staff',
            'kyc_status', 'kyc_submitted_at', 'kyc_rejection_reason',
            'is_premium', 'profile_completion_pct',
        ]

    def validate_role(self, value):
        instance = self.instance
        if value == 'admin':
            raise serializers.ValidationError("Cannot set admin role via profile.")
        if instance and instance.role == 'admin':
            raise serializers.ValidationError("Cannot change admin role.")
        if value == 'both' and instance and not instance.is_premium:
            raise serializers.ValidationError("Premium required to enable Both role.")
        return value


class ExpertiseTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpertiseTag
        fields = ['id', 'tag']
        read_only_fields = ['id']


class ConsultantListSerializer(serializers.ModelSerializer):
    skills = serializers.SerializerMethodField()
    expertise_tags = serializers.SerializerMethodField()
    avg_rating = serializers.SerializerMethodField()
    total_sessions = serializers.SerializerMethodField()
    next_available_slot = serializers.SerializerMethodField()

    def get_skills(self, obj):
        return [s.name for s in obj.skills.all()]

    def get_expertise_tags(self, obj):
        return [t.tag for t in obj.expertise_tags.all()]

    def get_avg_rating(self, obj):
        from django.db.models import Avg
        from consultations.models import Review
        result = Review.objects.filter(session__consultant=obj).aggregate(avg=Avg('rating'))
        return round(result['avg'], 1) if result['avg'] else None

    def get_total_sessions(self, obj):
        return obj.consultation_sessions_as_consultant.filter(status='completed').count()

    def get_next_available_slot(self, obj):
        import datetime
        days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        today_idx = datetime.date.today().weekday()
        slots = list(obj.consultation_availability.filter(is_available=True))
        for offset in range(7):
            day = days[(today_idx + offset) % 7]
            match = next((s for s in slots if s.day_of_week == day), None)
            if match:
                return {
                    'day': day,
                    'start_time': str(match.start_time),
                    'end_time': str(match.end_time),
                    'days_from_now': offset,
                }
        return None

    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 'bio',
            'profile_image', 'hourly_rate', 'is_verified', 'is_featured',
            'kyc_status', 'is_online', 'timezone', 'location', 'role',
            'working_industry', 'skills', 'expertise_tags',
            'avg_rating', 'total_sessions', 'next_available_slot',
        ]


class FreelancerListSerializer(serializers.ModelSerializer):
    skills = serializers.SerializerMethodField()
    expertise_tags = serializers.SerializerMethodField()
    completed_projects = serializers.SerializerMethodField()
    accepted_proposals = serializers.SerializerMethodField()
    avg_rating = serializers.SerializerMethodField()

    def get_skills(self, obj):
        return [s.name for s in obj.skills.all()]

    def get_expertise_tags(self, obj):
        return [t.tag for t in obj.expertise_tags.all()]

    def get_completed_projects(self, obj):
        return obj.proposals.filter(status='accepted').count()

    def get_accepted_proposals(self, obj):
        return obj.proposals.filter(status='accepted').count()

    def get_avg_rating(self, obj):
        from django.db.models import Avg
        from consultations.models import Review
        result = Review.objects.filter(session__consultant=obj).aggregate(avg=Avg('rating'))
        return round(result['avg'], 1) if result['avg'] else None

    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 'bio',
            'profile_image', 'hourly_rate', 'is_verified', 'is_featured',
            'kyc_status', 'is_online', 'location', 'role',
            'working_industry', 'skills', 'expertise_tags',
            'completed_projects', 'accepted_proposals', 'avg_rating',
        ]


class PublicConsultantSerializer(serializers.ModelSerializer):
    skills = serializers.SerializerMethodField()
    expertise_tags = serializers.SerializerMethodField()
    experiences = serializers.SerializerMethodField()
    avg_rating = serializers.SerializerMethodField()
    total_sessions = serializers.SerializerMethodField()
    total_reviews = serializers.SerializerMethodField()
    profile_completion_pct = serializers.SerializerMethodField()
    packages = serializers.SerializerMethodField()
    recent_reviews = serializers.SerializerMethodField()
    rating_distribution = serializers.SerializerMethodField()

    def get_skills(self, obj):
        return [{'name': s.name, 'proficiency': s.proficiency} for s in obj.skills.all()]

    def get_expertise_tags(self, obj):
        return [t.tag for t in obj.expertise_tags.all()]

    def get_experiences(self, obj):
        return [
            {
                'title': e.title,
                'company': e.company,
                'description': e.description,
                'start_date': str(e.start_date),
                'end_date': str(e.end_date) if e.end_date else None,
                'is_current': e.is_current,
            }
            for e in obj.experiences.all()
        ]

    def get_avg_rating(self, obj):
        from django.db.models import Avg
        from consultations.models import Review
        result = Review.objects.filter(session__consultant=obj).aggregate(avg=Avg('rating'))
        return round(result['avg'], 1) if result['avg'] else None

    def get_total_sessions(self, obj):
        return obj.consultation_sessions_as_consultant.filter(status='completed').count()

    def get_total_reviews(self, obj):
        from consultations.models import Review
        return Review.objects.filter(session__consultant=obj).count()

    def get_profile_completion_pct(self, obj):
        score = 0
        if obj.profile_image:
            score += 10
        if obj.bio:
            score += 10
        if obj.headline:
            score += 5
        if obj.location:
            score += 5
        if obj.hourly_rate:
            score += 10
        if obj.skills.exists():
            score += 10
        if obj.expertise_tags.exists():
            score += 10
        if obj.kyc_status == 'verified':
            score += 20
        if obj.what_i_help_with:
            score += 5
        if obj.linkedin_url or obj.portfolio_url:
            score += 5
        if obj.consultation_availability.exists():
            score += 5
        if obj.packages.filter(is_active=True).exists():
            score += 5
        return score

    def get_packages(self, obj):
        from consultations.models import ConsultantPackage
        pkgs = ConsultantPackage.objects.filter(consultant=obj, is_active=True)
        return [
            {
                'id': p.id,
                'name': p.name,
                'session_type': p.session_type,
                'duration_minutes': p.duration_minutes,
                'price': str(p.price),
                'description': p.description,
            }
            for p in pkgs
        ]

    def get_recent_reviews(self, obj):
        from consultations.models import Review
        reviews = Review.objects.filter(session__consultant=obj).select_related('reviewer').order_by('-created_at')[:10]
        return [
            {
                'reviewer_name': r.reviewer.get_full_name() or r.reviewer.username,
                'reviewer_image': r.reviewer.profile_image.url if r.reviewer.profile_image else None,
                'rating': r.rating,
                'comment': r.comment,
                'date': r.created_at.strftime('%b %Y'),
            }
            for r in reviews
        ]

    def get_rating_distribution(self, obj):
        from consultations.models import Review
        from django.db.models import Count
        dist = Review.objects.filter(session__consultant=obj).values('rating').annotate(count=Count('id'))
        result = {str(i): 0 for i in range(1, 6)}
        for row in dist:
            result[str(row['rating'])] = row['count']
        return result

    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 'email',
            'bio', 'profile_image', 'hourly_rate', 'location', 'timezone',
            'is_verified', 'is_featured', 'kyc_status', 'is_online', 'role',
            'working_industry', 'experience_description',
            'portfolio_url',
            # New fields
            'headline', 'years_of_experience', 'what_i_help_with', 'ideal_client',
            'languages', 'response_time_hours', 'preferred_communication',
            'linkedin_url', 'twitter_url', 'github_url', 'website_url',
            # Computed
            'skills', 'expertise_tags', 'experiences',
            'avg_rating', 'total_sessions', 'total_reviews',
            'profile_completion_pct', 'packages', 'recent_reviews', 'rating_distribution',
        ]


class KYCSubmitSerializer(serializers.Serializer):
    kyc_document_type = serializers.ChoiceField(choices=[
        ('aadhaar', 'Aadhaar Card'), ('pan', 'PAN Card'),
        ('passport', 'Passport'), ('driving_license', 'Driving License'),
        ('voter_id', 'Voter ID'),
    ])
    kyc_document_number = serializers.CharField(max_length=50)
