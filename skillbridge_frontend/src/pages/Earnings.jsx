import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { formatCurrency } from '../utils/formatters'

const STATUS_STYLES = {
  pending:    'bg-slate-100 text-slate-600',
  processing: 'bg-slate-100 text-slate-600',
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

function StatusBadge({ s }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[s] || 'bg-gray-100 text-gray-600'}`}>
      {STATUS_LABEL[s] || s}
    </span>
  )
}

function WithdrawModal({ wallet, onClose, onSuccess }) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const submit = async () => {
    const val = parseFloat(amount)
    if (!val || val <= 0) return setErr('Enter valid amount.')
    if (val > parseFloat(wallet.balance)) return setErr(`Max: ₹${parseFloat(wallet.balance).toFixed(2)}`)
    setLoading(true)
    setErr('')
    try {
      await api.post('/proposals/payments/request_withdrawal/', { amount: val })
      onSuccess()
    } catch (e) {
      setErr(e.response?.data?.detail || 'Request failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h3 className="font-bold text-gray-900 mb-1">Request Withdrawal</h3>
        <p className="text-sm text-gray-500 mb-4">Available: {formatCurrency(wallet.balance)}</p>
        {err && <p className="text-xs text-rose-600 mb-3">{err}</p>}
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="Amount in ₹"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button
            onClick={submit}
            disabled={loading}
            className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-50"
          >
            {loading ? 'Submitting…' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Earnings() {
  const { user } = useAuth()
  const isClient = user?.role === 'client'

  const [payments, setPayments] = useState([])
  const [legacySessions, setLegacySessions] = useState([])
  const [wallet, setWallet] = useState(null)
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      if (isClient) {
        const [paymentsRes, sessionsRes] = await Promise.all([
          api.get('/proposals/payments/my_payments/'),
          api.get('/consultations/sessions/my_sessions/'),
        ])
        const pList = Array.isArray(paymentsRes.data) ? paymentsRes.data : []
        setPayments(pList)
        // Sessions with cost but no matching Payment record = legacy/direct sessions
        const sessionList = Array.isArray(sessionsRes.data) ? sessionsRes.data : sessionsRes.data?.results || []
        const linkedIds = new Set(pList.filter(p => p.linked_session).map(p => p.linked_session))
        setLegacySessions(
          sessionList.filter(s => s.session_cost && Number(s.session_cost) > 0 && !linkedIds.has(s.id) && ['completed', 'payment_released'].includes(s.status))
        )
      } else {
        const [earningsRes, sessionsRes] = await Promise.all([
          api.get('/proposals/payments/my_earnings/'),
          ['consultant', 'both'].includes(user?.role) ? api.get('/consultations/sessions/my_sessions/') : Promise.resolve({ data: [] }),
        ])
        const pList = Array.isArray(earningsRes.data.payments) ? earningsRes.data.payments : []
        setPayments(pList)
        setWallet(earningsRes.data.wallet || null)
        setWithdrawals(Array.isArray(earningsRes.data.withdrawals) ? earningsRes.data.withdrawals : [])
        // Legacy sessions: completed with no linked Payment record (consultant side)
        const sessionList = Array.isArray(sessionsRes.data) ? sessionsRes.data : sessionsRes.data?.results || []
        const linkedSessionIds = new Set(pList.filter(p => p.linked_session).map(p => p.linked_session))
        setLegacySessions(
          sessionList.filter(s => s.session_cost && Number(s.session_cost) > 0 && !linkedSessionIds.has(s.id) && ['completed', 'payment_released'].includes(s.status))
        )
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [isClient])

  const totalPaid = payments.filter(p => ['released', 'completed', 'in_escrow', 'paid'].includes(p.status))
    .reduce((s, p) => s + Number(p.total_amount || p.amount || 0), 0)
    + legacySessions.reduce((s, sess) => s + Number(sess.session_cost || 0), 0)

  const escrowPayments = payments.filter(p => ['in_escrow', 'paid', 'completed'].includes(p.status))

  if (loading) return (
    <div className="space-y-6">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="h-3 w-24 rounded bg-slate-100" />
            <div className="mt-3 h-8 w-20 rounded-lg bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {showWithdrawModal && wallet && (
        <WithdrawModal
          wallet={wallet}
          onClose={() => setShowWithdrawModal(false)}
          onSuccess={() => { setShowWithdrawModal(false); load() }}
        />
      )}

      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Finance</p>
        <h1 className="mt-1 text-2xl font-black text-slate-950">
          {isClient ? 'Payment History' : 'My Earnings'}
        </h1>
      </div>

      {/* Wallet card (non-client only) */}
      {!isClient && wallet && (
        <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-6 shadow-sm">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-indigo-400 mb-3">Escrow Wallet</p>
              <div className="flex gap-8 flex-wrap">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Available</p>
                  <p className="text-2xl font-black text-emerald-600">{formatCurrency(wallet.balance)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">In Escrow</p>
                  <p className="text-2xl font-black text-blue-600">{formatCurrency(wallet.locked_balance)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Total</p>
                  <p className="text-2xl font-black text-slate-900">{formatCurrency(wallet.total)}</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition"
            >
              Request Withdrawal
            </button>
          </div>
        </div>
      )}

      {/* Legacy session notice — sessions completed outside escrow flow */}
      {!isClient && legacySessions.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span className="font-black">{legacySessions.length} session{legacySessions.length > 1 ? 's' : ''}</span> completed outside the escrow system — shown below but not in wallet balance. Future bookings go through escrow automatically.
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          {
            label: isClient ? 'Total Spent' : 'Total Received',
            value: formatCurrency(totalPaid),
            color: isClient ? 'text-rose-600' : 'text-emerald-600',
          },
          {
            label: 'Total Transactions',
            value: payments.length + legacySessions.length,
            color: 'text-blue-600',
          },
          {
            label: isClient ? 'In Escrow' : 'Awaiting Release',
            value: escrowPayments.length,
            color: 'text-amber-600',
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
            <p className={`mt-2 text-3xl font-black ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Escrow section (non-client) */}
      {!isClient && escrowPayments.length > 0 && (
        <div className="rounded-xl border border-blue-100 bg-white shadow-sm">
          <div className="border-b border-blue-50 px-6 py-4">
            <p className="font-black text-slate-950">Funds in Escrow</p>
            <p className="text-xs text-slate-500 mt-0.5">Awaiting client approval or admin release</p>
          </div>
          <div className="divide-y divide-slate-50">
            {escrowPayments.map(p => (
              <div key={p.id} className="px-6 py-4 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {p.proposal?.project?.title || p.linked_session ? 'Consultation Session' : `Payment #${p.id}`}
                  </p>
                  <p className="text-xs text-slate-500">{new Date(p.created_at).toLocaleDateString('en-IN')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-900">{formatCurrency(p.payout_amount || p.amount)}</span>
                  <StatusBadge s={p.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <p className="font-black text-slate-950">
            {isClient ? 'Payments Made' : 'All Payments'}
          </p>
        </div>

        {payments.length === 0 && legacySessions.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-400">
            {isClient ? 'No payments made yet.' : 'No payments received yet.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Service', 'Base', 'Total', 'Status', 'Date', 'Invoice'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 text-slate-900 max-w-[180px] truncate">
                      {p.proposal?.project?.title || (p.linked_session ? 'Consultation' : `Payment #${p.id}`)}
                    </td>
                    <td className="px-6 py-4 text-slate-700">{formatCurrency(p.amount)}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{formatCurrency(p.total_amount || p.amount)}</td>
                    <td className="px-6 py-4"><StatusBadge s={p.status} /></td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(p.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      {['released', 'completed', 'in_escrow'].includes(p.status) && (
                        <Link to={`/invoice/${p.id}`} className="text-xs text-indigo-600 hover:underline font-semibold">Invoice</Link>
                      )}
                    </td>
                  </tr>
                ))}
                {legacySessions.map(s => (
                  <tr key={`sess-${s.id}`} className="hover:bg-slate-50 transition bg-amber-50/30">
                    <td className="px-6 py-4 text-slate-900 max-w-[180px] truncate">
                      <span>{s.title || 'Consultation Session'}</span>
                      <span className="ml-2 rounded px-1.5 py-0.5 text-[10px] font-black bg-amber-100 text-amber-700">Direct</span>
                    </td>
                    <td className="px-6 py-4 text-slate-700">{formatCurrency(s.session_cost)}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{formatCurrency(s.session_cost)}</td>
                    <td className="px-6 py-4"><span className="rounded-lg px-2.5 py-1 text-xs font-black bg-emerald-50 text-emerald-700">completed</span></td>
                    <td className="px-6 py-4 text-slate-500">
                      {s.scheduled_date || new Date(s.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">—</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Withdrawal history (non-client) */}
      {!isClient && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <p className="font-black text-slate-950">Withdrawal Requests</p>
          </div>

          {withdrawals.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">No withdrawal requests yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Amount', 'Status', 'Note', 'Requested'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {withdrawals.map(w => (
                    <tr key={w.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-semibold text-slate-900">{formatCurrency(w.amount)}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          w.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                          w.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>{w.status}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">{w.note || '—'}</td>
                      <td className="px-6 py-4 text-slate-500">{new Date(w.created_at).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
