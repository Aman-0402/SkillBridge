import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'

// ─── helpers ────────────────────────────────────────────────────────────────
const fmt = v =>
  `₹${parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const STATUS_META = {
  pending:    { label: 'Pending',          color: 'bg-slate-100 text-slate-600',   dot: 'bg-slate-400' },
  processing: { label: 'Processing',       color: 'bg-slate-100 text-slate-600',   dot: 'bg-slate-400' },
  in_escrow:  { label: 'In Escrow',        color: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500'  },
  completed:  { label: 'Awaiting Release', color: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-400' },
  released:   { label: 'Released',         color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  failed:     { label: 'Failed',           color: 'bg-rose-100 text-rose-700',     dot: 'bg-rose-500'  },
  refunded:   { label: 'Refunded',         color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  disputed:   { label: 'Disputed',         color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
}

function StatusBadge({ s }) {
  const m = STATUS_META[s] || { label: s, color: 'bg-gray-100 text-gray-600' }
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${m.color}`}>{m.label}</span>
}

// ─── Escrow Status Tracker ───────────────────────────────────────────────────
const STEPS = [
  { key: 'in_escrow',  label: 'Payment Received',  sub: 'Funds held in escrow' },
  { key: 'completed',  label: 'Work Approved',      sub: 'Client confirmed delivery' },
  { key: 'released',   label: 'Payment Released',   sub: 'Funds sent to wallet' },
]

const STEP_ORDER = ['pending', 'in_escrow', 'completed', 'released']

function EscrowTracker({ currentStatus }) {
  const idx = STEP_ORDER.indexOf(currentStatus)
  return (
    <div className="mt-6">
      <p className="text-xs font-black uppercase tracking-wide text-gray-400 mb-4">Payment Progress</p>
      <div className="relative">
        {/* connector line */}
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200" />
        <div
          className="absolute top-4 left-4 h-0.5 bg-indigo-400 transition-all duration-700"
          style={{ width: `${Math.max(0, (idx - 1) / (STEPS.length - 1)) * 100}%` }}
        />
        <div className="relative flex justify-between">
          {STEPS.map((step, i) => {
            const stepIdx = STEP_ORDER.indexOf(step.key)
            const done = idx >= stepIdx
            const active = idx === stepIdx
            return (
              <div key={step.key} className="flex flex-col items-center gap-2 w-1/3">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold z-10 transition-all ${
                  done
                    ? 'border-indigo-500 bg-indigo-500 text-white'
                    : 'border-gray-300 bg-white text-gray-400'
                }`}>
                  {done ? '✓' : i + 1}
                </div>
                <div className="text-center">
                  <p className={`text-xs font-semibold ${done ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{step.sub}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Fee Breakdown ───────────────────────────────────────────────────────────
function FeeBreakdown({ fees }) {
  if (!fees) return null
  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between text-gray-600">
        <span>Base Fee</span>
        <span>{fmt(fees.base_amount)}</span>
      </div>
      <div className="flex justify-between text-gray-500 text-xs">
        <span>Platform Fee (6%)</span>
        <span>{fmt(fees.platform_fee)}</span>
      </div>
      <div className="flex justify-between text-gray-500 text-xs">
        <span>Convenience Fee (1%)</span>
        <span>{fmt(fees.convenience_fee)}</span>
      </div>
      <div className="flex justify-between text-gray-500 text-xs">
        <span>GST @ 18%</span>
        <span>{fmt(fees.gst_amount)}</span>
      </div>
      <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-900">
        <span>Total Payable</span>
        <span className="text-indigo-600 text-base">{fmt(fees.total_amount)}</span>
      </div>
      <div className="flex justify-between text-xs text-gray-400 border-t border-dashed border-gray-200 pt-2">
        <span>Consultant receives</span>
        <span>{fmt(fees.payout_amount)}</span>
      </div>
    </div>
  )
}

// ─── Mock Card Form ──────────────────────────────────────────────────────────
function formatCardNumber(v) {
  return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
}
function formatExpiry(v) {
  const digits = v.replace(/\D/g, '').slice(0, 4)
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
}

function CardForm({ total, onPay, processing }) {
  const [card, setCard] = useState({ name: '', number: '', expiry: '', cvv: '' })
  const [err, setErr] = useState('')

  const update = (field, val) => setCard(prev => ({ ...prev, [field]: val }))

  const submit = () => {
    if (!card.name.trim()) return setErr('Enter cardholder name.')
    const digits = card.number.replace(/\s/g, '')
    if (digits.length < 16) return setErr('Enter 16-digit card number.')
    if (card.expiry.length < 5) return setErr('Enter expiry (MM/YY).')
    if (card.cvv.length < 3) return setErr('Enter 3-digit CVV.')
    setErr('')
    onPay()
  }

  return (
    <div className="space-y-4">
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
        Demo mode — use any card details. No real transaction occurs.
      </div>

      {err && <p className="text-xs text-rose-600">{err}</p>}

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Cardholder Name</label>
        <input
          type="text"
          placeholder="John Doe"
          value={card.name}
          onChange={e => update('name', e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Card Number</label>
        <input
          type="text"
          placeholder="1234 5678 9012 3456"
          value={card.number}
          onChange={e => update('number', formatCardNumber(e.target.value))}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Expiry</label>
          <input
            type="text"
            placeholder="MM/YY"
            value={card.expiry}
            onChange={e => update('expiry', formatExpiry(e.target.value))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">CVV</label>
          <input
            type="password"
            placeholder="•••"
            maxLength={4}
            value={card.cvv}
            onChange={e => update('cvv', e.target.value.replace(/\D/g, '').slice(0, 4))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
      </div>

      <button
        onClick={submit}
        disabled={processing}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {processing ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Processing…
          </>
        ) : `Pay ${total}`}
      </button>

      <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
        <span>🔒</span>
        <span>Prototype — 256-bit encrypted simulation</span>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function Payment() {
  const { proposalId } = useParams()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session')
  const { user } = useAuth()

  // step: 'loading' | 'review' | 'card' | 'processing' | 'escrow' | 'existing'
  const [step, setStep] = useState('loading')
  const [proposal, setProposal] = useState(null)
  const [fees, setFees] = useState(null)
  const [paymentId, setPaymentId] = useState(null)
  const [payment, setPayment] = useState(null)
  const [error, setError] = useState('')
  const [processingMsg, setProcessingMsg] = useState('Verifying payment details…')

  const processingMessages = [
    'Verifying payment details…',
    'Contacting payment gateway…',
    'Authorizing transaction…',
    'Securing funds in escrow…',
    'Almost done…',
  ]
  const msgRef = useRef(0)

  useEffect(() => {
    loadData()
  }, [proposalId, sessionId])

  const loadData = async () => {
    try {
      if (proposalId) {
        const { data } = await api.get(`/projects/proposals/${proposalId}/`)
        setProposal(data)

        // check existing payment for this proposal
        const pr = await api.get('/proposals/payments/my_payments/')
        const existing = pr.data.find(p => p.proposal === parseInt(proposalId))
        if (existing) {
          setPayment(existing)
          setStep('existing')
          return
        }
      }
      setStep('review')
    } catch {
      setError('Failed to load.')
      setStep('review')
    }
  }

  const handleCalculateFees = async () => {
    setError('')
    try {
      const payload = proposalId ? { proposal_id: proposalId } : { session_id: sessionId }
      const { data } = await api.post('/proposals/payments/create_order/', payload)
      setFees(data.fees)
      setPaymentId(data.payment_id)
      setStep('card')
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to calculate fees.')
    }
  }

  const handlePay = async () => {
    setStep('processing')
    msgRef.current = 0
    setProcessingMsg(processingMessages[0])

    // rotate processing messages
    const interval = setInterval(() => {
      msgRef.current = Math.min(msgRef.current + 1, processingMessages.length - 1)
      setProcessingMsg(processingMessages[msgRef.current])
    }, 800)

    // simulate processing delay then call backend
    await new Promise(r => setTimeout(r, 2200))
    clearInterval(interval)

    try {
      await api.post('/proposals/payments/mock_pay/', { payment_id: paymentId })
      setStep('escrow')
      // refresh payment object
      const pr = await api.get('/proposals/payments/my_payments/')
      const updated = pr.data.find(p => p.id === paymentId)
      if (updated) setPayment(updated)
    } catch (e) {
      setError(e.response?.data?.detail || 'Payment failed.')
      setStep('card')
    }
  }

  const handleApproveCompletion = async () => {
    try {
      await api.post(`/proposals/payments/${payment.id}/approve_completion/`)
      const pr = await api.get('/proposals/payments/my_payments/')
      const updated = pr.data.find(p => p.id === payment.id)
      if (updated) setPayment(updated)
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed.')
    }
  }

  // ── layout ─────────────────────────────────────────────────────────────────
  if (step === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Existing payment — show tracker
  if (step === 'existing' && payment) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Link to="/projects" className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 mb-6">← Projects</Link>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-xl font-black text-gray-900">Payment Status</h1>
                <p className="text-sm text-gray-500 mt-1">{proposal?.project?.title}</p>
              </div>
              <StatusBadge s={payment.status} />
            </div>

            <FeeBreakdown fees={{
              base_amount: payment.amount,
              platform_fee: payment.platform_fee,
              gst_amount: payment.gst_amount,
              convenience_fee: payment.convenience_fee,
              total_amount: payment.total_amount,
              payout_amount: payment.payout_amount,
            }} />

            {!['failed', 'refunded', 'disputed'].includes(payment.status) && (
              <EscrowTracker currentStatus={payment.status} />
            )}

            {payment.status === 'in_escrow' && user?.role === 'client' && (
              <button
                onClick={handleApproveCompletion}
                className="mt-6 w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition"
              >
                Approve Work Completion
              </button>
            )}

            {['completed', 'released'].includes(payment.status) && (
              <Link
                to={`/invoice/${payment.id}`}
                className="mt-6 flex justify-center text-sm text-indigo-600 hover:underline font-semibold"
              >
                View GST Invoice →
              </Link>
            )}

            {payment.razorpay_payment_id && (
              <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400">Transaction Ref</p>
                <p className="font-mono text-xs text-gray-600 mt-0.5">{payment.razorpay_payment_id}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Processing screen
  if (step === 'processing') {
    return (
      <div className="min-h-screen bg-indigo-600 flex flex-col items-center justify-center text-white px-4">
        <div className="relative w-24 h-24 mb-8">
          <div className="absolute inset-0 rounded-full border-4 border-white/20" />
          <div className="absolute inset-0 rounded-full border-4 border-white border-t-transparent animate-spin" />
          <div className="absolute inset-3 rounded-full bg-white/10 flex items-center justify-center text-3xl">₹</div>
        </div>
        <h2 className="text-2xl font-black mb-2">Processing Payment</h2>
        <p className="text-indigo-200 text-sm">{processingMsg}</p>
        <div className="flex gap-1.5 mt-6">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
          ))}
        </div>
      </div>
    )
  }

  // Success / Escrow screen
  if (step === 'escrow') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-emerald-500 px-8 py-10 text-center text-white">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-4xl mx-auto mb-4">✓</div>
            <h2 className="text-2xl font-black">Payment Successful!</h2>
            <p className="text-emerald-100 mt-1 text-sm">Funds are held securely in escrow</p>
          </div>

          <div className="p-8">
            {fees && <FeeBreakdown fees={fees} />}
            <EscrowTracker currentStatus="in_escrow" />

            <div className="mt-6 p-3 bg-blue-50 rounded-xl text-xs text-blue-700">
              Funds will be released to the consultant after you approve work completion.
            </div>

            <div className="mt-4 flex gap-3">
              <Link to="/projects" className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 text-center font-semibold">
                Back to Projects
              </Link>
              <Link to="/earnings" className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-sm text-white font-semibold text-center transition">
                View Earnings
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Main layout (review + card) ────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Link to="/projects" className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 mb-6">← Projects</Link>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm">{error}</div>
        )}

        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-8">
          {['Review', 'Payment', 'Escrow'].map((label, i) => {
            const stepActive = (step === 'review' && i === 0) || (step === 'card' && i === 1)
            const stepDone = (step === 'card' && i === 0) || (step === 'escrow' && i < 2)
            return (
              <div key={label} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    stepDone ? 'bg-indigo-500 text-white' :
                    stepActive ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {stepDone ? '✓' : i + 1}
                  </div>
                  <span className={`text-sm font-semibold ${stepActive ? 'text-indigo-700' : 'text-gray-400'}`}>{label}</span>
                </div>
                {i < 2 && <div className="w-8 h-px bg-gray-300 mx-3" />}
              </div>
            )
          })}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left — order summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <p className="text-xs font-black uppercase tracking-wide text-gray-400 mb-4">Order Summary</p>

            {proposal && (
              <div className="space-y-3 mb-6">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Project</p>
                  <p className="font-semibold text-gray-900">{proposal.project?.title}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Consultant / Freelancer</p>
                  <p className="font-semibold text-gray-900">{proposal.freelancer?.username}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Bid Amount</p>
                  <p className="font-semibold text-gray-900">{fmt(proposal.bid_amount)}</p>
                </div>
              </div>
            )}

            <div className="border-t border-gray-100 pt-4">
              {fees ? (
                <FeeBreakdown fees={fees} />
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-500 text-xs"><span>Platform Fee (6%)</span><span>calculated on pay</span></div>
                  <div className="flex justify-between text-gray-500 text-xs"><span>Convenience (1%)</span><span>calculated on pay</span></div>
                  <div className="flex justify-between text-gray-500 text-xs"><span>GST @ 18%</span><span>calculated on pay</span></div>
                  <div className="flex justify-between font-bold text-gray-400 text-sm border-t pt-2"><span>Total</span><span>—</span></div>
                </div>
              )}
            </div>

            <div className="mt-6 p-3 bg-gray-50 rounded-xl space-y-1">
              <p className="text-xs font-semibold text-gray-700 flex items-center gap-1">🔒 Escrow Protection</p>
              <p className="text-xs text-gray-500">Funds are held securely until you approve work completion.</p>
            </div>
          </div>

          {/* Right — action panel */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
            {step === 'review' && (
              <>
                <p className="text-xs font-black uppercase tracking-wide text-gray-400 mb-4">Step 1 — Review</p>
                <div className="flex-1 space-y-4">
                  <div className="p-4 bg-indigo-50 rounded-xl text-sm text-indigo-700">
                    Review the order above then proceed to calculate the exact fee breakdown.
                  </div>
                  <div className="text-xs text-gray-400 space-y-1">
                    <p>• Platform Fee 6% — operational costs</p>
                    <p>• Convenience Fee 1% — payment processing</p>
                    <p>• GST 18% — government tax on base amount</p>
                  </div>
                </div>
                <button
                  onClick={handleCalculateFees}
                  className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition"
                >
                  Calculate Fees & Continue
                </button>
              </>
            )}

            {step === 'card' && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-black uppercase tracking-wide text-gray-400">Step 2 — Payment</p>
                  <button onClick={() => setStep('review')} className="text-xs text-gray-400 hover:text-gray-600">← Back</button>
                </div>
                <CardForm
                  total={fees ? fmt(fees.total_amount) : ''}
                  onPay={handlePay}
                  processing={false}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
