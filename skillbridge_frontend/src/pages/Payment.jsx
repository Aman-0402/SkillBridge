import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'

const STATUS_STYLES = {
  pending:    'bg-slate-100 text-slate-700',
  processing: 'bg-slate-100 text-slate-700',
  paid:       'bg-blue-100 text-blue-700',
  in_escrow:  'bg-blue-100 text-blue-700',
  completed:  'bg-amber-100 text-amber-700',
  released:   'bg-emerald-100 text-emerald-700',
  failed:     'bg-rose-100 text-rose-700',
  refunded:   'bg-purple-100 text-purple-700',
}

const STATUS_LABEL = {
  pending:    'Pending',
  processing: 'Processing',
  paid:       'Paid',
  in_escrow:  'In Escrow',
  completed:  'Awaiting Release',
  released:   'Released',
  failed:     'Failed',
  refunded:   'Refunded',
}

const loadRazorpay = () =>
  new Promise(resolve => {
    if (window.Razorpay) return resolve(true)
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })

function FeeRow({ label, value, bold, highlight }) {
  return (
    <div className={`flex justify-between items-center py-1.5 ${bold ? 'font-semibold text-gray-900' : 'text-gray-600'} ${highlight ? 'border-t border-gray-200 mt-1 pt-2.5 text-base' : 'text-sm'}`}>
      <span>{label}</span>
      <span className={highlight ? 'text-indigo-600 font-bold text-lg' : ''}>{value}</span>
    </div>
  )
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-600'}`}>
      {STATUS_LABEL[status] || status}
    </span>
  )
}

export default function Payment() {
  const { proposalId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [proposal, setProposal] = useState(null)
  const [fees, setFees] = useState(null)
  const [payment, setPayment] = useState(null)
  const [orderId, setOrderId] = useState(null)
  const [internalPaymentId, setInternalPaymentId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadProposal()
  }, [proposalId])

  const loadProposal = async () => {
    try {
      const { data } = await api.get(`/projects/proposals/${proposalId}/`)
      setProposal(data)

      // Check existing payment
      const pr = await api.get('/proposals/payments/my_payments/')
      const existing = pr.data.find(p => p.proposal === parseInt(proposalId))
      if (existing) setPayment(existing)
    } catch {
      setError('Failed to load proposal.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrder = async () => {
    setProcessing(true)
    setError('')
    try {
      const { data } = await api.post('/proposals/payments/create_order/', { proposal_id: proposalId })
      setFees(data.fees)
      setOrderId(data.razorpay_order_id)
      setInternalPaymentId(data.payment_id)
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to create order.')
    } finally {
      setProcessing(false)
    }
  }

  const handlePayNow = async () => {
    const loaded = await loadRazorpay()
    if (!loaded) {
      setError('Failed to load payment gateway. Check your internet connection.')
      return
    }

    setProcessing(true)
    setError('')

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_PLACEHOLDER',
      order_id: orderId,
      amount: Math.round(parseFloat(fees.total_amount) * 100),
      currency: 'INR',
      name: 'ConsultME',
      description: `Payment for: ${proposal?.project?.title || 'Service'}`,
      handler: async (response) => {
        try {
          await api.post('/proposals/payments/verify_payment/', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            payment_id: internalPaymentId,
          })
          setSuccess('Payment successful! Funds are in escrow.')
          loadProposal()
        } catch (e) {
          setError(e.response?.data?.detail || 'Payment verification failed.')
        } finally {
          setProcessing(false)
        }
      },
      modal: {
        ondismiss: () => setProcessing(false),
      },
      prefill: {
        name: user?.username || '',
        email: user?.email || '',
      },
      theme: { color: '#4f46e5' },
    }

    const rz = new window.Razorpay(options)
    rz.on('payment.failed', () => {
      setError('Payment failed. Please try again.')
      setProcessing(false)
    })
    rz.open()
  }

  const handleApproveCompletion = async () => {
    if (!payment) return
    setProcessing(true)
    setError('')
    try {
      await api.post(`/proposals/payments/${payment.id}/approve_completion/`)
      setSuccess('Work approved! Admin will release funds.')
      loadProposal()
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to approve.')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!proposal) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gray-50">
        <p className="text-gray-500">Proposal not found.</p>
        <Link to="/projects" className="text-indigo-600 hover:underline">Back to Projects</Link>
      </div>
    )
  }

  const displayFees = fees || (payment ? {
    base_amount: payment.amount,
    platform_fee: payment.platform_fee,
    gst_amount: payment.gst_amount,
    convenience_fee: payment.convenience_fee,
    total_amount: payment.total_amount,
    payout_amount: payment.payout_amount,
  } : null)

  const fmt = v => v != null ? `₹${parseFloat(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link to="/projects" className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 mb-6 font-medium">
          ← Back to Projects
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Payment</h1>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">{error}</div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">{success}</div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Order Summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

            <div className="space-y-3 mb-4">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Project</p>
                <p className="font-medium text-gray-900">{proposal.project?.title}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Freelancer</p>
                <p className="font-medium text-gray-900">{proposal.freelancer?.username}</p>
              </div>
              {payment && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Status</p>
                  <StatusBadge status={payment.status} />
                </div>
              )}
            </div>

            {displayFees && (
              <div className="border-t border-gray-100 pt-4 mt-4">
                <FeeRow label="Base Amount" value={fmt(displayFees.base_amount)} />
                <FeeRow label="Platform Fee (6%)" value={fmt(displayFees.platform_fee)} />
                <FeeRow label="Convenience Fee (1%)" value={fmt(displayFees.convenience_fee)} />
                <FeeRow label="GST (18%)" value={fmt(displayFees.gst_amount)} />
                <FeeRow label="Total You Pay" value={fmt(displayFees.total_amount)} bold highlight />
                <div className="mt-3 pt-3 border-t border-dashed border-gray-200">
                  <FeeRow label="Freelancer Receives" value={fmt(displayFees.payout_amount)} bold />
                </div>
              </div>
            )}

            {!displayFees && (
              <div className="border-t pt-4">
                <FeeRow label="Bid Amount" value={fmt(proposal.bid_amount)} bold highlight />
                <p className="text-xs text-gray-400 mt-2">Fee breakdown shown after clicking "Calculate Fees"</p>
              </div>
            )}

            {payment?.transaction_id && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-400">Transaction ID</p>
                <p className="text-xs font-mono text-gray-600 break-all">{payment.transaction_id}</p>
              </div>
            )}
          </div>

          {/* Action Panel */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment</h2>

            {!payment && !orderId && (
              <div className="flex-1 flex flex-col justify-between">
                <div className="space-y-3 mb-6">
                  <div className="p-3 bg-indigo-50 rounded-xl text-sm text-indigo-700">
                    Click below to calculate the exact fee breakdown and proceed to secure checkout.
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>Platform Fee: 6% of base amount</p>
                    <p>GST: 18% of base amount</p>
                    <p>Convenience Fee: 1% of base amount</p>
                  </div>
                </div>
                <button
                  onClick={handleCreateOrder}
                  disabled={processing}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
                >
                  {processing ? 'Calculating…' : 'Calculate Fees & Proceed'}
                </button>
              </div>
            )}

            {!payment && orderId && fees && (
              <div className="flex-1 flex flex-col justify-between">
                <div className="p-4 bg-emerald-50 rounded-xl text-sm text-emerald-700 mb-6">
                  Order created. Click "Pay Now" to open secure Razorpay checkout.
                </div>
                <button
                  onClick={handlePayNow}
                  disabled={processing}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing…
                    </span>
                  ) : (
                    <>Pay {fmt(fees.total_amount)}</>
                  )}
                </button>
                <p className="text-xs text-gray-400 text-center mt-3">Powered by Razorpay · 256-bit SSL</p>
              </div>
            )}

            {payment?.status === 'in_escrow' && (
              <div className="flex-1 flex flex-col justify-between">
                <div className="space-y-3 mb-6">
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <p className="text-sm font-semibold text-blue-800 mb-1">Funds in Escrow</p>
                    <p className="text-xs text-blue-600">Payment is held securely. Approve when work is completed to release funds to the freelancer.</p>
                  </div>
                </div>
                <button
                  onClick={handleApproveCompletion}
                  disabled={processing}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
                >
                  {processing ? 'Processing…' : 'Approve Work Completion'}
                </button>
              </div>
            )}

            {payment?.status === 'completed' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-3xl">⏳</div>
                <p className="font-semibold text-gray-900">Awaiting Admin Release</p>
                <p className="text-sm text-gray-500">Work approved. Admin will release funds to the freelancer shortly.</p>
                <Link to={`/invoice/${payment.id}`} className="text-sm text-indigo-600 hover:underline mt-2">View Invoice</Link>
              </div>
            )}

            {payment?.status === 'released' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-3xl">✅</div>
                <p className="font-semibold text-emerald-700">Payment Released</p>
                <p className="text-sm text-gray-500">Funds have been released to the freelancer's wallet.</p>
                <Link to={`/invoice/${payment.id}`} className="text-sm text-indigo-600 hover:underline mt-2">View Invoice</Link>
              </div>
            )}

            {payment?.status === 'failed' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center text-3xl">✗</div>
                <p className="font-semibold text-rose-700">Payment Failed</p>
                <p className="text-sm text-gray-500">Payment could not be processed.</p>
                <button onClick={() => { setPayment(null); setOrderId(null); setFees(null) }}
                  className="mt-2 text-sm text-indigo-600 hover:underline">Try Again</button>
              </div>
            )}

            {payment?.status === 'refunded' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-3xl">↩</div>
                <p className="font-semibold text-purple-700">Refunded</p>
                <p className="text-sm text-gray-500">Payment has been refunded.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
