from rest_framework import serializers
from .models import ConsultantAvailability, ConsultationSession, Review, ConsultantPackage, RescheduleRequest, ConsultantSessionRate
from users.serializers import UserSerializer

class ConsultantAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = ConsultantAvailability
        fields = ['id', 'day_of_week', 'start_time', 'end_time', 'is_available', 'buffer_minutes', 'max_bookings_per_slot']

class ReviewSerializer(serializers.ModelSerializer):
    reviewer = UserSerializer(read_only=True)
    session = serializers.PrimaryKeyRelatedField(
        queryset=ConsultationSession.objects.all(), write_only=True
    )

    class Meta:
        model = Review
        fields = ['id', 'session', 'reviewer', 'rating', 'comment', 'created_at']
        read_only_fields = ['id', 'created_at', 'reviewer']

class ConsultationSessionSerializer(serializers.ModelSerializer):
    consultant = UserSerializer(read_only=True)
    client = UserSerializer(read_only=True)
    review = ReviewSerializer(read_only=True)

    class Meta:
        model = ConsultationSession
        fields = [
            'id', 'consultant', 'client', 'session_type', 'title', 'description',
            'scheduled_date', 'start_time', 'end_time', 'session_cost', 'status',
            'notes', 'meeting_link', 'review', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'consultant', 'client']

class ConsultationSessionCreateSerializer(serializers.ModelSerializer):
    # Optional: provide rate_id + duration_minutes to compute session_cost server-side
    rate_id          = serializers.IntegerField(write_only=True, required=False)
    duration_minutes = serializers.IntegerField(write_only=True, required=False, min_value=15)

    class Meta:
        model = ConsultationSession
        fields = [
            'consultant', 'session_type', 'title', 'description',
            'scheduled_date', 'start_time', 'end_time', 'session_cost',
            'rate_id', 'duration_minutes',
        ]
        extra_kwargs = {
            'session_cost': {'required': False},
        }

    def validate(self, data):
        rate_id = data.pop('rate_id', None)
        duration_minutes = data.pop('duration_minutes', None)

        if rate_id is not None:
            try:
                rate = ConsultantSessionRate.objects.get(
                    id=rate_id,
                    consultant=data.get('consultant'),
                    is_active=True,
                )
            except ConsultantSessionRate.DoesNotExist:
                raise serializers.ValidationError({'rate_id': 'Invalid or inactive session rate.'})
            if duration_minutes is None:
                raise serializers.ValidationError({'duration_minutes': 'Required when rate_id is provided.'})
            import decimal
            data['session_cost'] = (rate.hourly_rate * decimal.Decimal(duration_minutes) / 60).quantize(decimal.Decimal('0.01'))
            data['session_type'] = rate.session_type

        if not data.get('session_cost'):
            raise serializers.ValidationError({'session_cost': 'Provide rate_id+duration_minutes or session_cost.'})

        return data


class RescheduleRequestSerializer(serializers.ModelSerializer):
    requested_by = UserSerializer(read_only=True)

    class Meta:
        model = RescheduleRequest
        fields = ['id', 'session', 'requested_by', 'new_date', 'new_start_time', 'new_end_time', 'message', 'status', 'created_at', 'updated_at']
        read_only_fields = ['id', 'requested_by', 'status', 'created_at', 'updated_at']


class ConsultantSessionRateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConsultantSessionRate
        fields = ['id', 'session_type', 'hourly_rate', 'is_active']
        read_only_fields = ['id']


class ConsultantPackageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConsultantPackage
        fields = ['id', 'name', 'session_type', 'duration_minutes', 'price', 'description', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']
