import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FaBell, FaCircleCheck, FaCheckDouble,
  FaCalendarCheck, FaIndianRupeeSign, FaBriefcase,
  FaStar, FaIdCard, FaRotate, FaTriangleExclamation,
  FaChevronRight, FaInbox,
} from 'react-icons/fa6'
import api from '../services/api'

/* ─── Type config ───────────────────────────────────────── */
const TYPE_CONFIG = {
  session_booked:          { icon: FaCalendarCheck, color: 'blue',   label: 'Session',  bg: 'bg-blue-500'   },
  session_confirmed:       { icon: FaCircleCheck,   color: 'emerald',label: 'Session',  bg: 'bg-emerald-500'},
  session_cancelled:       { icon: FaBell,          color: 'rose',   label: 'Session',  bg: 'bg-rose-500'   },
  session_completed:       { icon: FaCircleCheck,   color: 'emerald',label: 'Session',  bg: 'bg-emerald-500'},
  reschedule_requested:    { icon: FaRotate,        color: 'amber',  label: 'Session',  bg: 'bg-amber-500'  },
  reschedule_responded:    { icon: FaRotate,        color: 'amber',  label: 'Session',  bg: 'bg-amber-500'  },
  session_reminder:        { icon: FaCalendarCheck, color: 'cyan',   label: 'Session',  bg: 'bg-cyan-500'   },
  double_booking_conflict: { icon: FaTriangleExclamation, color: 'rose', label: 'Session', bg: 'bg-rose-500'},
  review_received:         { icon: FaStar,          color: 'amber',  label: 'Review',   bg: 'bg-amber-500'  },
  proposal_accepted:       { icon: FaCircleCheck,   color: 'emerald',label: 'Proposal', bg: 'bg-emerald-500'},
  proposal_received:       { icon: FaBriefcase,     color: 'violet', label: 'Proposal', bg: 'bg-violet-500' },
  job_application:         { icon: FaBriefcase,     color: 'violet', label: 'Job',      bg: 'bg-violet-500' },
  payment_success:         { icon: FaIndianRupeeSign,color:'emerald', label: 'Payment',  bg: 'bg-emerald-500'},
  payment_released:        { icon: FaIndianRupeeSign,color:'emerald', label: 'Payment',  bg: 'bg-emerald-500'},
  kyc_approved:            { icon: FaIdCard,        color: 'blue',   label: 'KYC',      bg: 'bg-blue-500'   },
  kyc_rejected:            { icon: FaIdCard,        color: 'rose',   label: 'KYC',      bg: 'bg-rose-500'   },
  general:                 { icon: FaBell,          color: 'slate',  label: 'General',  bg: 'bg-slate-500'  },
}

const COLOR_MAP = {
  blue:    { ring: 'ring-blue-200',    icon: 'text-blue-600',    pill: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'    },
  emerald: { ring: 'ring-emerald-200', icon: 'text-emerald-600', pill: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
  rose:    { ring: 'ring-rose-200',    icon: 'text-rose-600',    pill: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'    },
  amber:   { ring: 'ring-amber-200',   icon: 'text-amber-600',   pill: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
  violet:  { ring: 'ring-violet-200',  icon: 'text-violet-600',  pill: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200'},
  cyan:    { ring: 'ring-cyan-200',    icon: 'text-cyan-600',    pill: 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200'    },
  slate:   { ring: 'ring-slate-200',   icon: 'text-slate-500',   pill: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'},
}

const FILTERS = [
  { key: 'All',      label: 'All' },
  { key: 'Unread',   label: 'Unread' },
  { key: 'Session',  label: 'Sessions' },
  { key: 'Proposal', label: 'Proposals' },
  { key: 'Payment',  label: 'Payments' },
  { key: 'Job',      label: 'Jobs' },
  { key: 'KYC',      label: 'KYC' },
  { key: 'General',  label: 'General' },
]

function getLink(type, related_id) {
  const sessionTypes = [
    'session_booked','session_confirmed','session_cancelled','session_completed',
    'reschedule_requested','reschedule_responded','session_reminder','double_booking_conflict','review_received',
  ]
  if (sessionTypes.includes(type)) return '/manage-availability'
  if (['payment_success','payment_released'].includes(type)) return '/earnings'
  if (['proposal_accepted','proposal_received'].includes(type)) return related_id ? `/projects/${related_id}` : '/projects'
  if (type === 'job_application') return related_id ? `/jobs/${related_id}` : '/jobs'
  if (['kyc_approved','kyc_rejected'].includes(type)) return '/profile'
  return '/dashboard'
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function groupByDate(notifs) {
  const groups = {}
  const today = new Date()
  today.setHours(0,0,0,0)
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)

  notifs.forEach(n => {
    const d = new Date(n.created_at); d.setHours(0,0,0,0)
    let key
    if (d.getTime() === today.getTime()) key = 'Today'
    else if (d.getTime() === yesterday.getTime()) key = 'Yesterday'
    else key = d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })
    if (!groups[key]) groups[key] = []
    groups[key].push(n)
  })
  return groups
}

/* ─── Notification item ──────────────────────────────────── */
function NotifItem({ n, onNavigate }) {
  const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.general
  const colors = COLOR_MAP[cfg.color]
  const Icon = cfg.icon

  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      onClick={() => onNavigate(n)}
      className={`group relative flex w-full items-start gap-4 rounded-2xl border px-5 py-4 text-left transition-all duration-200
        ${!n.is_read
          ? 'border-blue-100 bg-gradient-to-r from-blue-50/80 to-white shadow-sm shadow-blue-100/50 hover:shadow-md hover:shadow-blue-100/60'
          : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/60 hover:shadow-sm'
        }`}
    >
      {/* Unread accent bar */}
      {!n.is_read && (
        <span className="absolute left-0 top-4 bottom-4 w-0.5 rounded-full bg-blue-500" />
      )}

      {/* Icon */}
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${colors.ring} bg-white shadow-sm`}>
        <Icon className={`text-sm ${colors.icon}`} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className={`text-sm leading-snug ${!n.is_read ? 'font-black text-slate-950' : 'font-bold text-slate-700'}`}>
            {n.title}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400">{timeAgo(n.created_at)}</span>
            {!n.is_read && <span className="h-2 w-2 rounded-full bg-blue-500" />}
          </div>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">{n.message}</p>
        <div className="mt-2 flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-black tracking-wide ${colors.pill}`}>
            {cfg.label}
          </span>
        </div>
      </div>

      {/* Arrow */}
      <FaChevronRight className="mt-3 shrink-0 text-[10px] text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500" />
    </motion.button>
  )
}

/* ─── Empty state ────────────────────────────────────────── */
function EmptyState({ filter }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-4 py-20 text-center"
    >
      <div className="relative">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 ring-1 ring-slate-200">
          <FaInbox className="text-2xl text-slate-300" />
        </div>
        <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 ring-2 ring-white">
          <FaCircleCheck className="text-[10px] text-slate-400" />
        </div>
      </div>
      <div>
        <p className="font-black text-slate-700">
          {filter === 'All' ? 'All caught up' : `No ${filter.toLowerCase()} notifications`}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          {filter === 'All'
            ? "You're up to date. New notifications will appear here."
            : `Switch to "All" to see everything.`}
        </p>
      </div>
    </motion.div>
  )
}

/* ─── Main page ──────────────────────────────────────────── */
export default function Notifications() {
  const [notifs, setNotifs]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('All')
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
    return (TYPE_CONFIG[n.type]?.label || 'General') === filter
  })

  const grouped = groupByDate(filtered)
  const unread = notifs.filter(n => !n.is_read).length

  return (
    <div className="relative min-h-full overflow-hidden">
      {/* Ambient background */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-100/40 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-80 rounded-full bg-violet-100/30 blur-3xl" />
      </div>

      <div className="px-6 py-6 lg:px-10">

        {/* ── Header ── */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 shadow-lg shadow-blue-200">
                <FaBell className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-950">Notifications</h1>
                <p className="mt-0.5 text-xs font-semibold text-slate-400">
                  {unread > 0
                    ? <><span className="font-black text-blue-600">{unread} unread</span> · {notifs.length} total</>
                    : `${notifs.length} total · All caught up`}
                </p>
              </div>
            </div>

            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-black text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              >
                <FaCheckDouble className="text-emerald-500" />
                Mark all read
              </button>
            )}
          </div>

          {/* Stats strip */}
          {notifs.length > 0 && (
            <div className="mt-5 grid grid-cols-3 gap-3 lg:max-w-sm">
              {[
                { label: 'Total', val: notifs.length, color: 'text-slate-700' },
                { label: 'Unread', val: unread, color: 'text-blue-600' },
                { label: 'Read', val: notifs.length - unread, color: 'text-emerald-600' },
              ].map(s => (
                <div key={s.label} className="rounded-2xl border border-slate-100 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm">
                  <p className={`text-xl font-black ${s.color}`}>{s.val}</p>
                  <p className="text-[11px] font-semibold text-slate-400">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Filter tabs ── */}
        <div className="mb-5 flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
          {FILTERS.map(f => {
            const count = f.key === 'Unread'
              ? notifs.filter(n => !n.is_read).length
              : f.key === 'All' ? notifs.length
              : notifs.filter(n => (TYPE_CONFIG[n.type]?.label || 'General') === f.key).length
            const active = filter === f.key
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`relative shrink-0 rounded-xl px-3.5 py-2 text-xs font-black transition-all duration-200 ${
                  active
                    ? 'bg-slate-950 text-white shadow-lg shadow-slate-950/20'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {f.label}
                {count > 0 && (
                  <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-black ${
                    active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex gap-4 rounded-2xl border border-slate-100 bg-white p-5">
                <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-100" />
                <div className="flex-1 space-y-2.5 pt-1">
                  <div className="h-3 w-48 animate-pulse rounded-full bg-slate-100" />
                  <div className="h-3 w-full animate-pulse rounded-full bg-slate-100" />
                  <div className="h-3 w-24 animate-pulse rounded-full bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
            <EmptyState filter={filter} />
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {Object.entries(grouped).map(([day, items]) => (
                <motion.div
                  key={day}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Day label */}
                  <div className="mb-3 flex items-center gap-3">
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">{day}</span>
                    <div className="h-px flex-1 bg-slate-100" />
                  </div>

                  {/* Items */}
                  <div className="grid gap-2 lg:grid-cols-2">
                    <AnimatePresence mode="popLayout">
                      {items.map(n => (
                        <NotifItem key={n.id} n={n} onNavigate={handleClick} />
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {filtered.length > 0 && (
          <p className="mt-6 text-center text-[11px] font-semibold text-slate-400">
            {filtered.length} notification{filtered.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  )
}
