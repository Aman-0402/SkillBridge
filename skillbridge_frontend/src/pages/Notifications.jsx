import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaBell, FaCircleCheck, FaFilter } from 'react-icons/fa6'
import api from '../services/api'

/* ─── Helpers ───────────────────────────────────────────── */
const TYPE_ICON = {
  proposal_accepted:      '🎉',
  proposal_received:      '📋',
  session_booked:         '📅',
  session_confirmed:      '✅',
  session_cancelled:      '❌',
  session_completed:      '🏁',
  review_received:        '⭐',
  kyc_approved:           '🔵',
  kyc_rejected:           '🔴',
  job_application:        '💼',
  payment_success:        '💳',
  payment_released:       '💰',
  reschedule_requested:   '🔄',
  reschedule_responded:   '📬',
  session_reminder:       '⏰',
  double_booking_conflict:'⚠️',
  general:                '🔔',
}

const TYPE_LABEL = {
  proposal_accepted:      'Proposal',
  proposal_received:      'Proposal',
  session_booked:         'Session',
  session_confirmed:      'Session',
  session_cancelled:      'Session',
  session_completed:      'Session',
  review_received:        'Review',
  kyc_approved:           'KYC',
  kyc_rejected:           'KYC',
  job_application:        'Job',
  payment_success:        'Payment',
  payment_released:       'Payment',
  reschedule_requested:   'Session',
  reschedule_responded:   'Session',
  session_reminder:       'Session',
  double_booking_conflict:'Session',
  general:                'General',
}

const TYPE_COLOR = {
  proposal_accepted:      'bg-emerald-100 text-emerald-700',
  proposal_received:      'bg-emerald-100 text-emerald-700',
  session_booked:         'bg-blue-100 text-blue-700',
  session_confirmed:      'bg-blue-100 text-blue-700',
  session_cancelled:      'bg-rose-100 text-rose-700',
  session_completed:      'bg-emerald-100 text-emerald-700',
  review_received:        'bg-amber-100 text-amber-700',
  kyc_approved:           'bg-blue-100 text-blue-700',
  kyc_rejected:           'bg-rose-100 text-rose-700',
  job_application:        'bg-violet-100 text-violet-700',
  payment_success:        'bg-emerald-100 text-emerald-700',
  payment_released:       'bg-emerald-100 text-emerald-700',
  reschedule_requested:   'bg-amber-100 text-amber-700',
  reschedule_responded:   'bg-amber-100 text-amber-700',
  session_reminder:       'bg-cyan-100 text-cyan-700',
  double_booking_conflict:'bg-rose-100 text-rose-700',
  general:                'bg-slate-100 text-slate-600',
}

function getLink(type, related_id) {
  const sessionTypes = [
    'session_booked', 'session_confirmed', 'session_cancelled', 'session_completed',
    'reschedule_requested', 'reschedule_responded', 'session_reminder', 'double_booking_conflict',
    'review_received',
  ]
  const paymentTypes = ['payment_success', 'payment_released']
  const proposalTypes = ['proposal_accepted', 'proposal_received']
  const jobTypes = ['job_application']
  const profileTypes = ['kyc_approved', 'kyc_rejected']

  if (sessionTypes.includes(type)) return '/manage-availability'
  if (paymentTypes.includes(type)) return '/earnings'
  if (proposalTypes.includes(type)) return related_id ? `/projects/${related_id}` : '/projects'
  if (jobTypes.includes(type)) return related_id ? `/jobs/${related_id}` : '/jobs'
  if (profileTypes.includes(type)) return '/profile'
  return '/dashboard'
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

const FILTERS = ['All', 'Unread', 'Session', 'Proposal', 'Payment', 'Job', 'KYC', 'General']

export default function Notifications() {
  const [notifs, setNotifs]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('All')
  const navigate = useNavigate()

  const fetchNotifs = useCallback(() => {
    api.get('/chat/notifications/list_notifications/')
      .then(res => setNotifs(Array.isArray(res.data) ? res.data : []))
      .catch(() => setNotifs([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchNotifs() }, [fetchNotifs])

  const markRead = async (id) => {
    await api.post('/chat/notifications/mark_read/', { id })
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const markAllRead = async () => {
    await api.post('/chat/notifications/mark_all_read/')
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const handleClick = async (n) => {
    if (!n.is_read) await markRead(n.id)
    navigate(getLink(n.type, n.related_id))
  }

  const filtered = notifs.filter(n => {
    if (filter === 'All') return true
    if (filter === 'Unread') return !n.is_read
    return TYPE_LABEL[n.type] === filter
  })

  const unread = notifs.filter(n => !n.is_read).length

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
            <FaBell className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-950">Notifications</h1>
            <p className="text-xs text-slate-500">{unread > 0 ? `${unread} unread` : 'All caught up'}</p>
          </div>
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-black text-slate-600 hover:bg-slate-50"
          >
            <FaCircleCheck className="text-emerald-500" /> Mark all read
          </button>
        )}
      </div>

      {/* Filter chips */}
      <div className="mb-5 flex items-center gap-1.5 overflow-x-auto pb-1">
        <FaFilter className="shrink-0 text-xs text-slate-400" />
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-black transition ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {f}
            {f === 'Unread' && unread > 0 && (
              <span className="ml-1 rounded-full bg-white/30 px-1 text-[10px]">{unread}</span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="space-y-px p-4">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex gap-3 rounded-xl p-3">
                <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-48 animate-pulse rounded bg-slate-100" />
                  <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
              <FaBell className="text-2xl text-slate-300" />
            </div>
            <p className="font-black text-slate-400">
              {filter === 'All' ? 'No notifications yet' : `No ${filter.toLowerCase()} notifications`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map(n => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`flex w-full items-start gap-3 px-4 py-4 text-left transition hover:bg-slate-50 ${
                  !n.is_read ? 'bg-blue-50/40' : ''
                }`}
              >
                {/* Icon */}
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${
                  !n.is_read ? 'bg-blue-100' : 'bg-slate-100'
                }`}>
                  {TYPE_ICON[n.type] || '🔔'}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-black text-slate-950 leading-tight">{n.title}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${TYPE_COLOR[n.type] || 'bg-slate-100 text-slate-500'}`}>
                      {TYPE_LABEL[n.type] || 'General'}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500 leading-snug">{n.message}</p>
                  <p className="mt-1.5 text-[10px] font-bold text-slate-400">{timeAgo(n.created_at)}</p>
                </div>

                {/* Unread dot */}
                {!n.is_read && (
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <p className="mt-3 text-center text-xs text-slate-400">{filtered.length} notification{filtered.length !== 1 ? 's' : ''}</p>
      )}
    </div>
  )
}
