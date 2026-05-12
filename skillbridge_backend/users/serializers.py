from rest_framework import serializers
from .models import User, Skill, Experience

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
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'bio', 'profile_image', 'hourly_rate', 'is_verified', 'is_featured', 'is_staff', 'identity', 'working_industry', 'state']

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
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'role',
            'bio', 'profile_image', 'hourly_rate', 'is_verified', 'is_staff',
            'phone', 'state', 'identity',
            'interest1', 'interest2', 'interest3',
            'working_industry', 'experience_description',
            'location', 'portfolio_url',
        ]
        read_only_fields = ['id', 'username', 'email', 'role', 'is_verified', 'is_staff']
