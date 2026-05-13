import { useState, useEffect } from 'react'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { formatCurrency } from '../utils/formatters'

export default function Earnings() {
  const { user } = useAuth()
  const isClient = user?.role === 'client'

  const [summary, setSummary] = useState(null)
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const endpoint = isClient
      ? '/proposals/payments/my_payments/'
      : '/proposals/payments/my_earnings/'

    api.get(endpoint)
      .then(res => {
        const data = res.data
        if (isClient) {
          // my_payments returns plain array
          const list = Array.isArray(data) ? data : []
          setPayments(list)
          setSummary({ total_spent: list.reduce((s, p) => s + Number(p.amount || 0), 0) })
        } else {
          setSummary(data)
          setPayments(Array.isArray(data.payments) ? data.payments : data.payments?.results || [])
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [isClient])

  const totalKey = isClient ? 'total_spent' : 'total_earned'
  const totalValue = summary?.[totalKey] ?? 0
  const avgValue = payments.length > 0 ? totalValue / payments.length : 0

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
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Finance</p>
        <h1 className="mt-1 text-2xl font-black text-slate-950">
          {isClient ? 'Payment History' : 'My Earnings'}
        </h1>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          {
            label: isClient ? 'Total Spent' : 'Total Earned',
            value: formatCurrency(totalValue),
            color: isClient ? 'text-rose-600' : 'text-emerald-600',
          },
          {
            label: isClient ? 'Total Payments Made' : 'Completed Payments',
            value: payments.length,
            color: 'text-blue-600',
          },
          {
            label: 'Average Payment',
            value: formatCurrency(avgValue),
            color: 'text-violet-600',
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
            <p className={`mt-2 text-3xl font-black ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Payment table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <p className="font-black text-slate-950">
            {isClient ? 'Payments Made' : 'Payment History'}
          </p>
        </div>

        {payments.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-400">
            {isClient ? 'No payments made yet.' : 'No payments received yet. Complete proposals to earn.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Transaction ID', isClient ? 'Paid To' : 'Project', 'Amount', 'Status', 'Date'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {payments.map(payment => (
                  <tr key={payment.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-mono text-xs text-slate-600">{payment.transaction_id || '—'}</td>
                    <td className="px-6 py-4 text-slate-900">
                      {isClient
                        ? (payment.paid_to?.username || payment.proposal?.freelancer || '—')
                        : (payment.proposal?.project?.title || '—')}
                    </td>
                    <td className="px-6 py-4 font-black text-slate-900">{formatCurrency(payment.amount)}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-black ${
                        payment.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                        payment.status === 'pending'   ? 'bg-amber-50 text-amber-700' :
                        'bg-rose-50 text-rose-700'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {payment.completed_at ? new Date(payment.completed_at).toLocaleDateString('en-IN') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
