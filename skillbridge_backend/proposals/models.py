from django.db import models
from django.contrib.auth import get_user_model
from projects.models import Proposal as ProjectProposal

User = get_user_model()

class Payment(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    )

    PAYMENT_METHOD_CHOICES = (
        ('mock', 'Mock Payment (Demo)'),
        ('credit_card', 'Credit Card'),
        ('debit_card', 'Debit Card'),
        ('wallet', 'Digital Wallet'),
    )

    proposal = models.OneToOneField(ProjectProposal, on_delete=models.CASCADE, related_name='payment')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='mock')
    transaction_id = models.CharField(max_length=255, unique=True)
    paid_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='payments_made')
    paid_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='payments_received')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"Payment {self.transaction_id} - {self.amount} ({self.status})"


class Transaction(models.Model):
    TRANSACTION_TYPE_CHOICES = (
        ('payment', 'Payment'),
        ('refund', 'Refund'),
        ('payout', 'Payout'),
    )

    payment = models.OneToOneField(Payment, on_delete=models.CASCADE, related_name='transaction')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPE_CHOICES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    from_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='transactions_from')
    to_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='transactions_to')
    description = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.transaction_type} - {self.amount}"
