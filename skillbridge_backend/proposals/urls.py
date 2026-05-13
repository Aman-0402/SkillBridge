from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaymentViewSet, TransactionViewSet, PaymentWebhookView

router = DefaultRouter()
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'transactions', TransactionViewSet, basename='transaction')

urlpatterns = [
    path('payments/webhook/', PaymentWebhookView.as_view(), name='payment-webhook'),
    path('', include(router.urls)),
]
