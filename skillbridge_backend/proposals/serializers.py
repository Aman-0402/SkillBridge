from rest_framework import serializers
from .models import Payment, Transaction
from users.serializers import UserSerializer

class TransactionSerializer(serializers.ModelSerializer):
    from_user = UserSerializer(read_only=True)
    to_user = UserSerializer(read_only=True)

    class Meta:
        model = Transaction
        fields = ['id', 'transaction_type', 'amount', 'from_user', 'to_user', 'description', 'created_at']
        read_only_fields = ['id', 'created_at']

class PaymentSerializer(serializers.ModelSerializer):
    paid_by = UserSerializer(read_only=True)
    paid_to = UserSerializer(read_only=True)
    transaction = TransactionSerializer(read_only=True)

    class Meta:
        model = Payment
        fields = ['id', 'proposal', 'amount', 'status', 'payment_method', 'transaction_id', 'paid_by', 'paid_to', 'transaction', 'created_at', 'updated_at', 'completed_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'completed_at', 'paid_by', 'paid_to']

class PaymentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['proposal', 'amount', 'payment_method']
