import uuid
from decimal import Decimal, ROUND_HALF_UP

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
        'payout_amount': base,
    }


def generate_mock_txn_id():
    """Generate a deterministic-looking fake transaction ID for the prototype."""
    return f"MOCK-{uuid.uuid4().hex[:8].upper()}-{uuid.uuid4().hex[:8].upper()}"


# ---------------------------------------------------------------------------
# Stub hooks — swap these implementations for real gateway calls later.
# Each function has the same signature the real integration will need.
# ---------------------------------------------------------------------------

def get_payment_client():
    """Return a payment gateway client. Replace body with real SDK init."""
    return None  # stub


def verify_payment_signature(order_id, payment_id, signature):
    """Verify gateway HMAC. Replace with real HMAC check."""
    return True  # always valid in mock mode


def verify_webhook_signature(payload_body, signature):
    """Verify webhook HMAC. Replace with real HMAC check."""
    return True  # always valid in mock mode
