import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../services/api'

const fmt = v => `₹${parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const STATUS_STYLES = {
  pending:    'bg-slate-100 text-slate-600',
  in_escrow:  'bg-blue-100 text-blue-700',
  completed:  'bg-amber-100 text-amber-700',
  released:   'bg-emerald-100 text-emerald-700',
  failed:     'bg-rose-100 text-rose-700',
  refunded:   'bg-purple-100 text-purple-700',
}

export default function Invoice() {
  const { paymentId } = useParams()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/proposals/payments/invoice/', { params: { payment_id: paymentId } })
      .then(r => setInvoice(r.data))
      .catch(e => setError(e.response?.data?.detail || 'Failed to load invoice.'))
      .finally(() => setLoading(false))
  }, [paymentId])

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error || !invoice) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gray-50">
      <p className="text-gray-500">{error || 'Invoice not found.'}</p>
      <Link to="/earnings" className="text-indigo-600 hover:underline text-sm">Back to Earnings</Link>
    </div>
  )

  const invoiceNumber = `INV-${invoice.payment_id}-${new Date(invoice.created_at).toISOString().slice(0, 10).replace(/-/g, '')}`
  const invoiceDate = new Date(invoice.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })

  const base = parseFloat(invoice.base_amount || 0)
  const platformFee = parseFloat(invoice.platform_fee || 0)
  const convenienceFee = parseFloat(invoice.convenience_fee || 0)
  const gst = parseFloat(invoice.gst_amount || 0)
  const total = parseFloat(invoice.total_amount || base)

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 print:bg-white print:py-0">
      <style>{`@media print { .no-print { display: none !important; } body { background: white; } }`}</style>

      {/* Actions bar */}
      <div className="no-print max-w-3xl mx-auto flex items-center justify-between mb-6">
        <Link to="/earnings" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">← Back to Earnings</Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition"
        >
          🖨 Print Invoice
        </button>
      </div>

      {/* Invoice card */}
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none print:border-none">
        {/* Header */}
        <div className="bg-indigo-600 px-8 py-6 text-white">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-2xl font-black tracking-tight">ConsultME</p>
              <p className="text-indigo-200 text-sm mt-0.5">Freelance & Consulting Platform</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-black uppercase tracking-widest text-indigo-200 text-xs mb-1">Tax Invoice</p>
              <p className="text-xl font-black">{invoiceNumber}</p>
              <p className="text-indigo-200 text-sm mt-0.5">{invoiceDate}</p>
            </div>
          </div>
        </div>

        {/* Parties */}
        <div className="grid grid-cols-2 gap-6 px-8 py-6 border-b border-gray-100">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-gray-400 mb-2">Bill From</p>
            <p className="font-bold text-gray-900">{invoice.bill_from.name || '—'}</p>
            <p className="text-sm text-gray-500">{invoice.bill_from.email || ''}</p>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-gray-400 mb-2">Bill To</p>
            <p className="font-bold text-gray-900">{invoice.bill_to.name || '—'}</p>
            <p className="text-sm text-gray-500">{invoice.bill_to.email || ''}</p>
          </div>
        </div>

        {/* Service description */}
        <div className="px-8 py-4 border-b border-gray-100">
          <p className="text-xs font-black uppercase tracking-wide text-gray-400 mb-1">Service</p>
          <p className="text-gray-900">{invoice.service_description || '—'}</p>
        </div>

        {/* Line items */}
        <div className="px-8 py-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-xs font-black uppercase tracking-wide text-gray-400">Description</th>
                <th className="text-right py-2 text-xs font-black uppercase tracking-wide text-gray-400">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <tr>
                <td className="py-3 text-gray-700">Service Fee (base)</td>
                <td className="py-3 text-right text-gray-900 font-medium">{fmt(base)}</td>
              </tr>
              <tr>
                <td className="py-3 text-gray-700">Platform Fee (6%)</td>
                <td className="py-3 text-right text-gray-900 font-medium">{fmt(platformFee)}</td>
              </tr>
              <tr>
                <td className="py-3 text-gray-700">Convenience Fee (1%)</td>
                <td className="py-3 text-right text-gray-900 font-medium">{fmt(convenienceFee)}</td>
              </tr>
              <tr>
                <td className="py-3 text-gray-700">
                  <span>GST @ 18%</span>
                  <span className="ml-2 text-xs text-gray-400">(on base amount)</span>
                </td>
                <td className="py-3 text-right text-gray-900 font-medium">{fmt(gst)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200">
                <td className="pt-4 pb-2 font-black text-gray-900 text-base">Total</td>
                <td className="pt-4 pb-2 text-right font-black text-indigo-600 text-xl">{fmt(total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 space-y-3">
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Transaction ID</p>
              <p className="font-mono text-gray-700 text-xs">{invoice.transaction_id}</p>
            </div>
            {invoice.razorpay_payment_id && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Razorpay Payment ID</p>
                <p className="font-mono text-gray-700 text-xs">{invoice.razorpay_payment_id}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Status</p>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_STYLES[invoice.status] || 'bg-gray-100 text-gray-600'}`}>
                {invoice.status}
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-400 pt-2 border-t border-gray-200">
            This is a computer-generated invoice. No signature required.
            ConsultME is a marketplace platform. GST is applicable as per applicable laws.
          </p>
        </div>
      </div>
    </div>
  )
}
