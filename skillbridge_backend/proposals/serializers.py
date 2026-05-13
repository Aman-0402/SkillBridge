from rest_framework import serializers
from .models import Payment, Transaction, EscrowWallet, Withdrawal
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
    transactions = TransactionSerializer(many=True, read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'proposal', 'linked_session',
            'amount', 'platform_fee', 'gst_amount', 'convenience_fee', 'total_amount', 'payout_amount',
            'status', 'payment_method', 'transaction_id',
            'razorpay_order_id', 'razorpay_payment_id',
            'paid_by', 'paid_to', 'transactions',
            'created_at', 'updated_at', 'completed_at', 'released_at',
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'completed_at', 'released_at',
            'paid_by', 'paid_to', 'transaction_id',
            'platform_fee', 'gst_amount', 'convenience_fee', 'total_amount', 'payout_amount',
            'razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature',
        ]


class EscrowWalletSerializer(serializers.ModelSerializer):
    total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = EscrowWallet
        fields = ['balance', 'locked_balance', 'total', 'updated_at']
        read_only_fields = ['balance', 'locked_balance', 'total', 'updated_at']


class WithdrawalSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Withdrawal
        fields = ['id', 'user', 'amount', 'status', 'note', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'status', 'created_at', 'updated_at']
