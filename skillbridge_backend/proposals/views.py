"""
Prototype payment system — no real payment gateway.
All transactions are simulated with mock IDs.
Gateway stub hooks are in utils.py for future Razorpay/Cashfree/Stripe swap-in.
"""
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
from .utils import calculate_fees, generate_mock_txn_id
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
            return Payment.objects.all().select_related('proposal', 'linked_session', 'paid_by', 'paid_to')
        return Payment.objects.filter(
            models.Q(paid_by=user) | models.Q(paid_to=user)
        ).select_related('proposal', 'linked_session', 'paid_by', 'paid_to')

    # ------------------------------------------------------------------
    # Step 1 — Create order (calculate fees + persist pending payment)
    # ------------------------------------------------------------------
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
            payment_method='mock',
        )

        return Response({
            'payment_id': payment.id,
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

    # ------------------------------------------------------------------
    # Step 2 — Simulate payment (client submits "card", goes to escrow)
    # ------------------------------------------------------------------
    @action(detail=False, methods=['post'])
    def mock_pay(self, request):
        payment_id = request.data.get('payment_id')
        if not payment_id:
            return Response({'detail': 'payment_id required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payment = Payment.objects.get(id=payment_id, paid_by=request.user)
        except Payment.DoesNotExist:
            return Response({'detail': 'Payment not found.'}, status=status.HTTP_404_NOT_FOUND)

        if payment.status not in ('pending', 'processing'):
            return Response({'detail': f'Payment already {payment.status}.'}, status=status.HTTP_400_BAD_REQUEST)

        mock_txn = generate_mock_txn_id()

        with db_transaction.atomic():
            payment.razorpay_payment_id = mock_txn   # re-used field for mock txn reference
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
                description=f'Mock payment received. Ref: {mock_txn}. Funds placed in escrow.',
            )

        return Response({
            'detail': 'Payment successful. Funds are in escrow.',
            'status': 'in_escrow',
            'transaction_ref': mock_txn,
        })

    # ------------------------------------------------------------------
    # Step 3 — Client approves work completion
    # ------------------------------------------------------------------
    @action(detail=True, methods=['post'])
    def approve_completion(self, request, pk=None):
        payment = self.get_object()

        if payment.paid_by != request.user:
            return Response({'detail': 'Only payer can approve completion.'}, status=status.HTTP_403_FORBIDDEN)

        if payment.status != 'in_escrow':
            return Response({'detail': f'Expected in_escrow, got {payment.status}.'}, status=status.HTTP_400_BAD_REQUEST)

        payment.status = 'completed'
        payment.completed_at = timezone.now()
        payment.save()

        return Response({'detail': 'Work approved. Admin will release funds.', 'status': 'completed'})

    # ------------------------------------------------------------------
    # Step 4 — Admin releases funds from escrow → wallet
    # ------------------------------------------------------------------
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
                description='Funds released from escrow to wallet by admin.',
            )

        return Response({'detail': 'Funds released to wallet.', 'status': 'released'})

    # ------------------------------------------------------------------
    # Admin — mark as disputed
    # ------------------------------------------------------------------
    @action(detail=True, methods=['post'])
    def dispute(self, request, pk=None):
        if not request.user.is_staff or request.user.role != 'admin':
            return Response({'detail': 'Admin only.'}, status=status.HTTP_403_FORBIDDEN)

        payment = self.get_object()
        reason = request.data.get('reason', '')

        if payment.status in ('released', 'refunded', 'disputed'):
            return Response({'detail': f'Cannot dispute a {payment.status} payment.'}, status=status.HTTP_400_BAD_REQUEST)

        payment.status = 'disputed'
        payment.save()

        Transaction.objects.create(
            payment=payment,
            transaction_type='payment',
            amount=payment.total_amount,
            from_user=request.user,
            to_user=None,
            description=f'Payment flagged as disputed by admin. Reason: {reason or "not specified"}',
        )

        return Response({'detail': 'Payment marked as disputed.', 'status': 'disputed'})

    # ------------------------------------------------------------------
    # Admin — refund payment (restores locked balance)
    # ------------------------------------------------------------------
    @action(detail=True, methods=['post'])
    def admin_refund(self, request, pk=None):
        if not request.user.is_staff or request.user.role != 'admin':
            return Response({'detail': 'Admin only.'}, status=status.HTTP_403_FORBIDDEN)

        payment = self.get_object()

        if payment.status in ('released', 'refunded'):
            return Response({'detail': f'Cannot refund a {payment.status} payment.'}, status=status.HTTP_400_BAD_REQUEST)

        reason = request.data.get('reason', '')

        with db_transaction.atomic():
            if payment.status == 'in_escrow' and payment.paid_to:
                wallet = _get_or_create_wallet(payment.paid_to)
                if wallet.locked_balance >= payment.payout_amount:
                    wallet.locked_balance -= payment.payout_amount
                    wallet.save()

            payment.status = 'refunded'
            payment.save()

            Transaction.objects.create(
                payment=payment,
                transaction_type='refund',
                amount=payment.total_amount,
                from_user=payment.paid_to,
                to_user=payment.paid_by,
                description=f'Refund issued by admin. Reason: {reason or "not specified"}',
            )

        return Response({'detail': 'Payment refunded.', 'status': 'refunded'})

    # ------------------------------------------------------------------
    # Wallet + earnings
    # ------------------------------------------------------------------
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

        return Response(WithdrawalSerializer(withdrawal).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def my_wallet(self, request):
        wallet = _get_or_create_wallet(request.user)
        return Response(EscrowWalletSerializer(wallet).data)

    @action(detail=False, methods=['get'])
    def my_payments(self, request):
        payments = Payment.objects.filter(paid_by=request.user).order_by('-created_at')
        return Response(self.get_serializer(payments, many=True).data)

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

        return Response({
            'payment_id': payment.id,
            'transaction_id': str(payment.transaction_id),
            'mock_payment_ref': payment.razorpay_payment_id or '—',
            'status': payment.status,
            'created_at': payment.created_at,
            'service_description': service_description,
            'bill_from': {
                'name': (payment.paid_to.get_full_name() or payment.paid_to.username) if payment.paid_to else '',
                'email': payment.paid_to.email if payment.paid_to else '',
            },
            'bill_to': {
                'name': (payment.paid_by.get_full_name() or payment.paid_by.username) if payment.paid_by else '',
                'email': payment.paid_by.email if payment.paid_by else '',
            },
            'base_amount': str(payment.amount),
            'platform_fee': str(payment.platform_fee or 0),
            'gst_amount': str(payment.gst_amount or 0),
            'convenience_fee': str(payment.convenience_fee or 0),
            'total_amount': str(payment.total_amount or payment.amount),
            'payout_amount': str(payment.payout_amount or payment.amount),
        })


class TransactionViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = TransactionSerializer

    def get_queryset(self):
        user = self.request.user
        return Transaction.objects.filter(models.Q(from_user=user) | models.Q(to_user=user))


class PaymentWebhookView(APIView):
    """
    Stub webhook endpoint — no-op in prototype mode.
    Replace body with real gateway webhook handling when integrating.
    """
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        return Response({'detail': 'OK'})
