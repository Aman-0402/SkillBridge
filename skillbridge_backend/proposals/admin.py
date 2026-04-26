from django.contrib import admin
from .models import Payment, Transaction

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['transaction_id', 'amount', 'status', 'paid_by', 'paid_to', 'created_at']
    list_filter = ['status', 'payment_method', 'created_at']
    search_fields = ['transaction_id', 'paid_by__username', 'paid_to__username']

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['transaction_type', 'amount', 'from_user', 'to_user', 'created_at']
    list_filter = ['transaction_type', 'created_at']
    search_fields = ['from_user__username', 'to_user__username']
