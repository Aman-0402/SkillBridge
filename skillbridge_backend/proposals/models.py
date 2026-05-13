import uuid
from decimal import Decimal
from django.db import models
from django.contrib.auth import get_user_model
from projects.models import Proposal as ProjectProposal

User = get_user_model()


class Payment(models.Model):
    STATUS_CHOICES = (
        ('pending',    'Pending'),
        ('processing', 'Processing'),
        ('paid',       'Paid'),
        ('in_escrow',  'In Escrow'),
        ('completed',  'Completed'),
        ('released',   'Released'),
        ('failed',     'Failed'),
        ('refunded',   'Refunded'),
        ('disputed',   'Disputed'),
    )

    PAYMENT_METHOD_CHOICES = (
        ('razorpay',    'Razorpay'),
        ('mock',        'Mock Payment (Demo)'),
        ('credit_card', 'Credit Card'),
        ('debit_card',  'Debit Card'),
        ('wallet',      'Digital Wallet'),
    )

    # Linked entity — either a proposal OR a consultation session (both nullable)
    proposal = models.ForeignKey(
        ProjectProposal, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='payments'
    )
    linked_session = models.ForeignKey(
        'consultations.ConsultationSession', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='payments'
    )

    # Parties
    paid_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='payments_made')
    paid_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='payments_received')

    # Amounts
    amount = models.DecimalField(max_digits=10, decimal_places=2)          # base / agreed amount
    platform_fee = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    gst_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    convenience_fee = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)   # client pays
    payout_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)  # consultant receives

    # Status & method
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='razorpay')

    # Identifiers
    transaction_id = models.CharField(max_length=255, unique=True, default=uuid.uuid4)
    razorpay_order_id = models.CharField(max_length=100, blank=True, null=True, unique=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True, null=True)
    razorpay_signature = models.CharField(max_length=255, blank=True, null=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    released_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"Payment {self.transaction_id} - {self.total_amount or self.amount} ({self.status})"


class Transaction(models.Model):
    TRANSACTION_TYPE_CHOICES = (
        ('payment', 'Payment'),
        ('refund',  'Refund'),
        ('payout',  'Payout'),
    )

    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPE_CHOICES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    from_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='transactions_from')
    to_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='transactions_to')
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.transaction_type} - {self.amount}"


class EscrowWallet(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='wallet')
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    locked_balance = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def total(self):
        return self.balance + self.locked_balance

    def __str__(self):
        return f"{self.user.username} wallet — available: {self.balance}, locked: {self.locked_balance}"


class Withdrawal(models.Model):
    STATUS_CHOICES = (
        ('pending',  'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='withdrawals')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} withdrawal {self.amount} ({self.status})"
