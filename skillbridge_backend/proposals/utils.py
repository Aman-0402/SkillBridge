import hmac
import hashlib
from decimal import Decimal, ROUND_HALF_UP
from django.conf import settings

PLATFORM_FEE_RATE = Decimal('0.06')
GST_RATE = Decimal('0.18')
CONVENIENCE_FEE_RATE = Decimal('0.01')
TWO_PLACES = Decimal('0.01')


def calculate_fees(base_amount):
    base = Decimal(str(base_amount)).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
    platform_fee = (base * PLATFORM_FEE_RATE).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
    gst = (base * GST_RATE).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
    convenience_fee = (base * CONVENIENCE_FEE_RATE).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
    total = (base + platform_fee + gst + convenience_fee).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
    return {
        'base_amount': base,
        'platform_fee': platform_fee,
        'gst_amount': gst,
        'convenience_fee': convenience_fee,
        'total_amount': total,
        'payout_amount': base,  # consultant receives base; platform keeps fees; GST is tax
    }


def get_razorpay_client():
    import razorpay
    return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


def verify_razorpay_signature(order_id, payment_id, signature):
    key = settings.RAZORPAY_KEY_SECRET.encode('utf-8')
    msg = f"{order_id}|{payment_id}".encode('utf-8')
    expected = hmac.new(key, msg, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


def verify_webhook_signature(payload_body, signature):
    secret = getattr(settings, 'RAZORPAY_WEBHOOK_SECRET', '')
    if not secret:
        return False
    key = secret.encode('utf-8')
    expected = hmac.new(key, payload_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


def to_paise(amount_decimal):
    """Convert Decimal rupees to integer paise for Razorpay API."""
    return int((Decimal(str(amount_decimal)) * 100).quantize(Decimal('1'), rounding=ROUND_HALF_UP))
