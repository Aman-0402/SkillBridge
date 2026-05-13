import json
from decimal import Decimal
from django.db import models, transaction as db_transaction
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Payment, Transaction, EscrowWallet, Withdrawal
from .serializers import PaymentSerializer, EscrowWalletSerializer, WithdrawalSerializer, TransactionSerializer
from .utils import calculate_fees, get_razorpay_client, verify_razorpay_signature, verify_webhook_signature, to_paise
from projects.models import Proposal


def _get_or_create_wallet(user):
    wallet, _ = EscrowWallet.objects.get_or_create(user=user)
    return wallet


class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = PaymentSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_staff and user.role == 'admin':
            return Payment.objects.all()
        return Payment.objects.filter(models.Q(paid_by=user) | models.Q(paid_to=user))

    @action(detail=False, methods=['post'])
    def create_order(self, request):
        proposal_id = request.data.get('proposal_id')
        session_id = request.data.get('session_id')

        if not proposal_id and not session_id:
            return Response({'detail': 'proposal_id or session_id required.'}, status=status.HTTP_400_BAD_REQUEST)

        proposal = None
        linked_session = None
        paid_to = None
        base_amount = None
        description = ''

        if proposal_id:
            try:
                from projects.models import Proposal as ProjectProposal
                proposal = ProjectProposal.objects.get(id=proposal_id)
            except ProjectProposal.DoesNotExist:
                return Response({'detail': 'Proposal not found.'}, status=status.HTTP_404_NOT_FOUND)
            if proposal.status != 'accepted':
                return Response({'detail': 'Proposal must be accepted before payment.'}, status=status.HTTP_400_BAD_REQUEST)
            paid_to = proposal.freelancer
            base_amount = proposal.bid_amount
            description = f'Payment for project: {proposal.project.title}'

        elif session_id:
            try:
                from consultations.models import ConsultationSession
                linked_session = ConsultationSession.objects.get(id=session_id)
            except ConsultationSession.DoesNotExist:
                return Response({'detail': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)
            if linked_session.status not in ('confirmed', 'pending'):
                return Response({'detail': 'Session not in payable state.'}, status=status.HTTP_400_BAD_REQUEST)
            paid_to = linked_session.consultant
            base_amount = linked_session.session_cost
            description = f'Consultation session with {paid_to.username}'

        fees = calculate_fees(base_amount)
        total_paise = to_paise(fees['total_amount'])

        rz = get_razorpay_client()
        try:
            order = rz.order.create({
                'amount': total_paise,
                'currency': 'INR',
                'payment_capture': 1,
                'notes': {'description': description},
            })
        except Exception as e:
            return Response({'detail': f'Razorpay error: {str(e)}'}, status=status.HTTP_502_BAD_GATEWAY)

        payment = Payment.objects.create(
            proposal=proposal,
            linked_session=linked_session,
            paid_by=request.user,
            paid_to=paid_to,
            amount=fees['base_amount'],
            platform_fee=fees['platform_fee'],
            gst_amount=fees['gst_amount'],
            convenience_fee=fees['convenience_fee'],
            total_amount=fees['total_amount'],
            payout_amount=fees['payout_amount'],
            status='pending',
            payment_method='razorpay',
            razorpay_order_id=order['id'],
        )

        return Response({
            'payment_id': payment.id,
            'razorpay_order_id': order['id'],
            'fees': {
                'base_amount': str(fees['base_amount']),
                'platform_fee': str(fees['platform_fee']),
                'gst_amount': str(fees['gst_amount']),
                'convenience_fee': str(fees['convenience_fee']),
                'total_amount': str(fees['total_amount']),
                'payout_amount': str(fees['payout_amount']),
            },
            'description': description,
        })

    @action(detail=False, methods=['post'])
    def verify_payment(self, request):
        order_id = request.data.get('razorpay_order_id')
        payment_id = request.data.get('razorpay_payment_id')
        signature = request.data.get('razorpay_signature')
        internal_payment_id = request.data.get('payment_id')

        if not all([order_id, payment_id, signature, internal_payment_id]):
            return Response({'detail': 'Missing required fields.'}, status=status.HTTP_400_BAD_REQUEST)

        if not verify_razorpay_signature(order_id, payment_id, signature):
            return Response({'detail': 'Invalid payment signature.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payment = Payment.objects.get(id=internal_payment_id, paid_by=request.user)
        except Payment.DoesNotExist:
            return Response({'detail': 'Payment not found.'}, status=status.HTTP_404_NOT_FOUND)

        if payment.status not in ('pending', 'processing'):
            return Response({'detail': f'Payment already {payment.status}.'}, status=status.HTTP_400_BAD_REQUEST)

        with db_transaction.atomic():
            payment.razorpay_payment_id = payment_id
            payment.razorpay_signature = signature
            payment.status = 'in_escrow'
            payment.save()

            wallet = _get_or_create_wallet(payment.paid_to)
            wallet.locked_balance += payment.payout_amount
            wallet.save()

            Transaction.objects.create(
                payment=payment,
                transaction_type='payment',
                amount=payment.total_amount,
                from_user=payment.paid_by,
                to_user=payment.paid_to,
                description='Funds placed in escrow.',
            )

        return Response({'detail': 'Payment verified. Funds in escrow.', 'status': 'in_escrow'})

    @action(detail=True, methods=['post'])
    def approve_completion(self, request, pk=None):
        payment = self.get_object()

        if payment.paid_by != request.user:
            return Response({'detail': 'Only payer can approve completion.'}, status=status.HTTP_403_FORBIDDEN)

        if payment.status != 'in_escrow':
            return Response({'detail': f'Payment status is {payment.status}, expected in_escrow.'}, status=status.HTTP_400_BAD_REQUEST)

        payment.status = 'completed'
        payment.completed_at = timezone.now()
        payment.save()

        return Response({'detail': 'Work approved. Admin will release funds.', 'status': 'completed'})

    @action(detail=True, methods=['post'])
    def release(self, request, pk=None):
        if not request.user.is_staff or request.user.role != 'admin':
            return Response({'detail': 'Admin only.'}, status=status.HTTP_403_FORBIDDEN)

        payment = self.get_object()

        if payment.status != 'completed':
            return Response({'detail': f'Payment must be completed before release. Current: {payment.status}.'}, status=status.HTTP_400_BAD_REQUEST)

        with db_transaction.atomic():
            wallet = _get_or_create_wallet(payment.paid_to)
            if wallet.locked_balance < payment.payout_amount:
                return Response({'detail': 'Insufficient locked balance.'}, status=status.HTTP_400_BAD_REQUEST)
            wallet.locked_balance -= payment.payout_amount
            wallet.balance += payment.payout_amount
            wallet.save()

            payment.status = 'released'
            payment.released_at = timezone.now()
            payment.save()

            Transaction.objects.create(
                payment=payment,
                transaction_type='payout',
                amount=payment.payout_amount,
                from_user=None,
                to_user=payment.paid_to,
                description='Funds released from escrow to wallet.',
            )

        return Response({'detail': 'Funds released to consultant/freelancer wallet.', 'status': 'released'})

    @action(detail=False, methods=['post'])
    def request_withdrawal(self, request):
        amount = request.data.get('amount')
        if not amount:
            return Response({'detail': 'amount required.'}, status=status.HTTP_400_BAD_REQUEST)

        amount = Decimal(str(amount))
        if amount <= 0:
            return Response({'detail': 'Amount must be positive.'}, status=status.HTTP_400_BAD_REQUEST)

        with db_transaction.atomic():
            wallet = _get_or_create_wallet(request.user)
            if wallet.balance < amount:
                return Response({'detail': f'Insufficient balance. Available: ₹{wallet.balance}'}, status=status.HTTP_400_BAD_REQUEST)
            wallet.balance -= amount
            wallet.save()

            withdrawal = Withdrawal.objects.create(user=request.user, amount=amount)

        serializer = WithdrawalSerializer(withdrawal)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def my_wallet(self, request):
        wallet = _get_or_create_wallet(request.user)
        serializer = EscrowWalletSerializer(wallet)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def invoice(self, request):
        payment_id = request.query_params.get('payment_id')
        if not payment_id:
            return Response({'detail': 'payment_id required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payment = Payment.objects.get(id=payment_id)
        except Payment.DoesNotExist:
            return Response({'detail': 'Payment not found.'}, status=status.HTTP_404_NOT_FOUND)

        if payment.paid_by != request.user and payment.paid_to != request.user:
            if not (request.user.is_staff and request.user.role == 'admin'):
                return Response({'detail': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

        service_description = ''
        if payment.proposal:
            service_description = f'Freelance project: {payment.proposal.project.title}'
        elif payment.linked_session:
            service_description = f'Consultation session with {payment.paid_to.username if payment.paid_to else "consultant"}'

        data = {
            'payment_id': payment.id,
            'transaction_id': str(payment.transaction_id),
            'razorpay_payment_id': payment.razorpay_payment_id,
            'status': payment.status,
            'created_at': payment.created_at,
            'service_description': service_description,
            'bill_from': {
                'name': payment.paid_to.get_full_name() or payment.paid_to.username if payment.paid_to else '',
                'email': payment.paid_to.email if payment.paid_to else '',
            },
            'bill_to': {
                'name': payment.paid_by.get_full_name() or payment.paid_by.username if payment.paid_by else '',
                'email': payment.paid_by.email if payment.paid_by else '',
            },
            'base_amount': str(payment.amount),
            'platform_fee': str(payment.platform_fee or 0),
            'gst_amount': str(payment.gst_amount or 0),
            'convenience_fee': str(payment.convenience_fee or 0),
            'total_amount': str(payment.total_amount or payment.amount),
            'payout_amount': str(payment.payout_amount or payment.amount),
        }
        return Response(data)

    @action(detail=False, methods=['get'])
    def my_payments(self, request):
        payments = Payment.objects.filter(paid_by=request.user).order_by('-created_at')
        serializer = self.get_serializer(payments, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_earnings(self, request):
        payments = Payment.objects.filter(paid_to=request.user).order_by('-created_at')
        wallet = _get_or_create_wallet(request.user)
        withdrawals = Withdrawal.objects.filter(user=request.user).order_by('-created_at')
        return Response({
            'wallet': EscrowWalletSerializer(wallet).data,
            'payments': self.get_serializer(payments, many=True).data,
            'withdrawals': WithdrawalSerializer(withdrawals, many=True).data,
        })


class TransactionViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = TransactionSerializer

    def get_queryset(self):
        user = self.request.user
        return Transaction.objects.filter(models.Q(from_user=user) | models.Q(to_user=user))


class PaymentWebhookView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        payload_body = request.body
        signature = request.headers.get('X-Razorpay-Signature', '')

        if not verify_webhook_signature(payload_body, signature):
            return Response({'detail': 'Invalid signature.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            event = json.loads(payload_body)
        except json.JSONDecodeError:
            return Response({'detail': 'Invalid JSON.'}, status=status.HTTP_400_BAD_REQUEST)

        event_type = event.get('event')
        payload = event.get('payload', {}).get('payment', {}).get('entity', {})
        rz_order_id = payload.get('order_id')

        if not rz_order_id:
            return Response({'detail': 'OK'})

        try:
            payment = Payment.objects.get(razorpay_order_id=rz_order_id)
        except Payment.DoesNotExist:
            return Response({'detail': 'OK'})

        if event_type == 'payment.captured' and payment.status in ('pending', 'processing'):
            with db_transaction.atomic():
                payment.razorpay_payment_id = payload.get('id', '')
                payment.status = 'in_escrow'
                payment.save()

                wallet = _get_or_create_wallet(payment.paid_to)
                wallet.locked_balance += payment.payout_amount
                wallet.save()

                Transaction.objects.create(
                    payment=payment,
                    transaction_type='payment',
                    amount=payment.total_amount,
                    from_user=payment.paid_by,
                    to_user=payment.paid_to,
                    description='Funds placed in escrow (webhook).',
                )

        elif event_type == 'payment.failed' and payment.status in ('pending', 'processing'):
            payment.status = 'failed'
            payment.save()

        return Response({'detail': 'OK'})
