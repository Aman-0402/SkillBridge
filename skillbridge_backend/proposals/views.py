from django.db import models
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
import uuid
from .models import Payment, Transaction
from .serializers import PaymentSerializer, PaymentCreateSerializer, TransactionSerializer
from projects.models import Proposal

class PaymentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = PaymentSerializer

    def get_queryset(self):
        user = self.request.user
        return Payment.objects.filter(models.Q(paid_by=user) | models.Q(paid_to=user))

    def get_serializer_class(self):
        if self.action == 'create':
            return PaymentCreateSerializer
        return PaymentSerializer

    def perform_create(self, serializer):
        try:
            proposal = serializer.validated_data['proposal']
            serializer.save(
                paid_by=self.request.user,
                paid_to=proposal.freelancer,
                transaction_id=f"MOCK-{uuid.uuid4().hex[:12].upper()}"
            )
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def process_payment(self, request, pk=None):
        payment = self.get_object()

        if payment.status != 'pending':
            return Response({'detail': f'Payment is already {payment.status}'}, status=status.HTTP_400_BAD_REQUEST)

        if payment.paid_by != request.user:
            return Response({'detail': 'Only payment initiator can process payment'}, status=status.HTTP_403_FORBIDDEN)

        # Mock Payment Processing
        payment.status = 'processing'
        payment.save()

        # Simulate payment processing (in real system, call Razorpay/Stripe API)
        try:
            # Mock: Randomly succeed or fail (90% success rate for demo)
            import random
            if random.random() < 0.9:
                payment.status = 'completed'
                payment.completed_at = timezone.now()
                payment.save()

                # Create transaction record
                Transaction.objects.create(
                    payment=payment,
                    transaction_type='payment',
                    amount=payment.amount,
                    from_user=payment.paid_by,
                    to_user=payment.paid_to,
                    description=f'Payment for proposal on {payment.proposal.project.title}'
                )

                # Update proposal status
                payment.proposal.status = 'accepted'
                payment.proposal.save()

                return Response({
                    'detail': 'Payment successful!',
                    'transaction_id': payment.transaction_id,
                    'status': 'completed'
                })
            else:
                payment.status = 'failed'
                payment.save()
                return Response({
                    'detail': 'Payment failed. Please try again.',
                    'status': 'failed'
                }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            payment.status = 'failed'
            payment.save()
            return Response({
                'detail': f'Payment processing error: {str(e)}',
                'status': 'failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def refund_payment(self, request, pk=None):
        payment = self.get_object()

        if payment.status != 'completed':
            return Response({'detail': 'Only completed payments can be refunded'}, status=status.HTTP_400_BAD_REQUEST)

        if payment.paid_by != request.user and payment.paid_to != request.user:
            return Response({'detail': 'Only payment participants can refund'}, status=status.HTTP_403_FORBIDDEN)

        payment.status = 'refunded'
        payment.save()

        # Create refund transaction
        Transaction.objects.create(
            payment=payment,
            transaction_type='refund',
            amount=payment.amount,
            from_user=payment.paid_to,
            to_user=payment.paid_by,
            description=f'Refund for proposal on {payment.proposal.project.title}'
        )

        return Response({'detail': 'Payment refunded successfully'})

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_payments(self, request):
        payments = Payment.objects.filter(paid_by=request.user)
        serializer = self.get_serializer(payments, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_earnings(self, request):
        payments = Payment.objects.filter(paid_to=request.user, status='completed')
        total_earned = sum(p.amount for p in payments)
        serializer = self.get_serializer(payments, many=True)
        return Response({
            'total_earned': total_earned,
            'payments': serializer.data
        })

class TransactionViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = TransactionSerializer

    def get_queryset(self):
        user = self.request.user
        return Transaction.objects.filter(models.Q(from_user=user) | models.Q(to_user=user))
