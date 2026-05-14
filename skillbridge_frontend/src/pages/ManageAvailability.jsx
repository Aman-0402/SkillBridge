import { useState, useEffect } from 'react'
import {
  FaCalendarCheck, FaCalendarPlus, FaTrash, FaCircleCheck,
  FaClock, FaUser, FaIndianRupeeSign, FaStar,
  FaChevronLeft, FaChevronRight, FaList, FaCalendarDays,
  FaArrowsRotate, FaXmark, FaCheck, FaLightbulb,
} from 'react-icons/fa6'
import Swal from 'sweetalert2'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'

/* ─── Countdown timer ──────────────────────────────────── */
function Countdown({ date, startTime }) {
  const [remaining, setRemaining] = useState(null)

  useEffect(() => {
    const sessionMs = new Date(`${date}T${startTime}`).getTime()
    const tick = () => setRemaining(sessionMs - Date.now())
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [date, startTime])

  if (remaining === null) return null

  const pad = n => String(n).padStart(2, '0')

  if (remaining <= 0) return (
    <span className="rounded-lg bg-cyan-50 px-2.5 py-1 text-xs font-black text-cyan-700">
      Session started
    </span>
  )

  const totalSecs = Math.floor(remaining / 1000)
  const days = Math.floor(totalSecs / 86400)
  const hours = Math.floor((totalSecs % 86400) / 3600)
  const mins = Math.floor((totalSecs % 3600) / 60)
  const secs = totalSecs % 60

  if (days > 0) return (
    <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700">
      {days}d {pad(hours)}h away
    </span>
  )

  return (
    <span className={`rounded-lg px-2.5 py-1 text-xs font-black tabular-nums ${hours === 0 ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
      {pad(hours)}:{pad(mins)}:{pad(secs)}
    </span>
  )
}

/* ─── Status badge ─────────────────────────────────────── */
const STATUS_STYLES = {
  pending:                'bg-amber-50 text-amber-700',
  awaiting_approval:      'bg-violet-50 text-violet-700',
  confirmed:              'bg-blue-50 text-blue-700',
  in_progress:            'bg-cyan-50 text-cyan-700',
  completed:              'bg-emerald-50 text-emerald-700',
  cancelled:              'bg-rose-50 text-rose-600',
  refunded:               'bg-slate-100 text-slate-500',
  reschedule_requested:   'bg-orange-50 text-orange-700',
  rescheduled:            'bg-teal-50 text-teal-700',
}
const STATUS_LABELS = {
  pending:                'Pending',
  awaiting_approval:      'Awaiting Approval',
  confirmed:              'Confirmed',
  in_progress:            'In Progress',
  completed:              'Completed',
  cancelled:              'Cancelled',
  refunded:               'Refunded',
  reschedule_requested:   'Reschedule Requested',
  rescheduled:            'Rescheduled',
}
function StatusBadge({ status }) {
  return (
    <span className={`rounded-lg px-2.5 py-1 text-xs font-black ${STATUS_STYLES[status] || 'bg-slate-100 text-slate-600'}`}>
      {STATUS_LABELS[status] || status}
    </span>
  )
}

/* ─── Reschedule templates ─────────────────────────────── */
const CONSULTANT_TEMPLATES = [
  'I have a medical emergency and need to reschedule. Apologies for the inconvenience.',
  'I have an unavoidable prior commitment that came up. Requesting a reschedule.',
  'Technical issues on my end — unable to proceed at the current slot.',
  'Personal emergency. Proposing the new slot below. Sorry for the disruption.',
]
const CLIENT_DECLINE_TEMPLATES = [
  'The original slot works for me. Please keep it.',
  'Neither slot works — can you suggest another time?',
  'This reschedule does not fit my schedule. Please cancel if needed.',
]

/* ─── Reschedule modal ─────────────────────────────────── */
function RescheduleModal({ session, onClose, onSubmit }) {
  const [form, setForm] = useState({ new_date: '', new_start_time: '', new_end_time: '', message: '' })
  const [saving, setSaving] = useState(false)

  const applyTemplate = (tpl) => setForm(f => ({ ...f, message: tpl }))
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.new_date || !form.new_start_time || !form.new_end_time) {
      Swal.fire({ icon: 'warning', title: 'Fill all date/time fields', timer: 1800, showConfirmButton: false })
      return
    }
    setSaving(true)
    try {
      await onSubmit({ session: session.id, ...form })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-950">Request Reschedule</h3>
            <p className="mt-0.5 text-xs text-slate-500">{session.title} · {session.scheduled_date}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <FaXmark />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="grid gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500">
            New Date
            <input type="date" value={form.new_date} min={new Date().toISOString().split('T')[0]}
              onChange={e => set('new_date', e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500">
              Start Time
              <input type="time" value={form.new_start_time} onChange={e => set('new_start_time', e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              />
            </label>
            <label className="grid gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500">
              End Time
              <input type="time" value={form.new_end_time} onChange={e => set('new_end_time', e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              />
            </label>
          </div>

          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500">
              <FaLightbulb className="text-amber-500" /> Quick templates
            </p>
            <div className="flex flex-wrap gap-2">
              {CONSULTANT_TEMPLATES.map((tpl, i) => (
                <button key={i} type="button" onClick={() => applyTemplate(tpl)}
                  className="rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1 text-[11px] font-black text-orange-700 transition hover:bg-orange-100">
                  {tpl.split(' ').slice(0, 4).join(' ')}…
                </button>
              ))}
            </div>
          </div>

          <label className="grid gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500">
            Message to client
            <textarea rows={3} value={form.message} onChange={e => set('message', e.target.value)}
              placeholder="Explain the reason for reschedule..."
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            />
          </label>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-black text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 rounded-xl bg-orange-500 py-2.5 text-sm font-black text-white hover:bg-orange-600 disabled:opacity-60">
              {saving ? 'Sending…' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── Reschedule request card (client responding) ──────── */
function RescheduleRequestCard({ req, onRespond }) {
  const [message, setMessage] = useState('')
  const [responding, setResponding] = useState(false)

  const respond = async (action) => {
    setResponding(true)
    try {
      await onRespond(req.id, action, message)
    } finally {
      setResponding(false)
    }
  }

  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <FaArrowsRotate className="text-orange-500" />
        <p className="text-sm font-black text-slate-950">Reschedule Request</p>
        <span className="ml-auto text-[10px] font-black text-slate-400">
          {new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </span>
      </div>
      <div className="mb-2 space-y-1 text-xs text-slate-600">
        <p><span className="font-black">Proposed date:</span> {req.new_date}</p>
        <p><span className="font-black">Time:</span> {req.new_start_time} – {req.new_end_time}</p>
        {req.message && <p className="mt-2 italic text-slate-500">"{req.message}"</p>}
      </div>

      <div className="mb-2">
        <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
          <FaLightbulb className="text-amber-500" /> Quick replies
        </p>
        <div className="flex flex-wrap gap-1.5">
          {CLIENT_DECLINE_TEMPLATES.map((tpl, i) => (
            <button key={i} onClick={() => setMessage(tpl)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-black text-slate-600 transition hover:border-orange-300 hover:bg-orange-50">
              {tpl.split(' ').slice(0, 4).join(' ')}…
            </button>
          ))}
        </div>
      </div>

      <textarea rows={2} value={message} onChange={e => setMessage(e.target.value)}
        placeholder="Optional message..."
        className="mb-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
      />

      <div className="flex gap-2">
        <button onClick={() => respond('approve')} disabled={responding}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 text-xs font-black text-white hover:bg-emerald-500 disabled:opacity-60">
          <FaCheck /> Approve
        </button>
        <button onClick={() => respond('reject')} disabled={responding}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-rose-200 py-2 text-xs font-black text-rose-600 hover:bg-rose-50 disabled:opacity-60">
          <FaXmark /> Decline
        </button>
      </div>
    </div>
  )
}

/* ─── Skeleton ─────────────────────────────────────────── */
function SessionSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-100 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="h-4 w-48 rounded bg-slate-200" />
          <div className="h-3 w-32 rounded bg-slate-100" />
          <div className="h-3 w-40 rounded bg-slate-100" />
        </div>
        <div className="h-6 w-20 rounded-lg bg-slate-200" />
      </div>
    </div>
  )
}

/* ─── Star Rating picker ───────────────────────────────── */
function StarRating({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" onClick={() => onChange(n)}>
          <FaStar className={`text-xl ${n <= value ? 'text-amber-400' : 'text-slate-200'}`} />
        </button>
      ))}
    </div>
  )
}

/* ─── Session calendar ─────────────────────────────────── */
function SessionCalendar({ sessions }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selected, setSelected] = useState(null)

  const prevMonth = () => month === 0 ? (setMonth(11), setYear(y => y - 1)) : setMonth(m => m - 1)
  const nextMonth = () => month === 11 ? (setMonth(0), setYear(y => y + 1)) : setMonth(m => m + 1)

  const pad = n => String(n).padStart(2, '0')
  const toKey = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`

  const firstDOW = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayKey = toKey(now.getFullYear(), now.getMonth(), now.getDate())

  const byDate = {}
  sessions.forEach(s => {
    if (s.scheduled_date) {
      byDate[s.scheduled_date] = byDate[s.scheduled_date] || []
      byDate[s.scheduled_date].push(s)
    }
  })

  const cells = [
    ...Array(firstDOW).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const DOT = { pending: 'bg-amber-400', confirmed: 'bg-blue-500', completed: 'bg-emerald-500', cancelled: 'bg-rose-400' }
  const monthLabel = new Date(year, month).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  const selectedSessions = selected ? byDate[selected] || [] : []

  return (
    <div className="space-y-3">
      {/* Month navigation */}
      <div className="flex items-center gap-2">
        <button onClick={prevMonth} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50">
          <FaChevronLeft className="text-xs" />
        </button>
        <span className="flex-1 text-center text-sm font-black text-slate-950">{monthLabel}</span>
        <button onClick={nextMonth} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50">
          <FaChevronRight className="text-xs" />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 text-center">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <div key={d} className="py-1 text-[10px] font-black text-slate-400">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={`e-${i}`} />
          const key = toKey(year, month, d)
          const daySessions = byDate[key] || []
          const isToday = key === todayKey
          const isSelected = selected === key
          return (
            <button
              key={key}
              onClick={() => setSelected(isSelected ? null : key)}
              className={`flex flex-col items-center rounded-xl py-2 text-sm font-black transition ${
                isSelected
                  ? 'bg-blue-600 text-white'
                  : isToday
                    ? 'bg-blue-50 text-blue-700'
                    : daySessions.length > 0
                      ? 'bg-slate-50 text-slate-900 hover:bg-slate-100'
                      : 'text-slate-400 hover:bg-slate-50'
              }`}
            >
              {d}
              {daySessions.length > 0 && (
                <div className="mt-0.5 flex gap-0.5">
                  {daySessions.slice(0, 3).map((s, si) => (
                    <span key={si} className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white/70' : DOT[s.status] || 'bg-slate-300'}`} />
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-100 pt-3">
        {Object.entries(DOT).map(([status, cls]) => (
          <span key={status} className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 capitalize">
            <span className={`h-2 w-2 rounded-full ${cls}`} /> {status}
          </span>
        ))}
      </div>

      {/* Selected day detail */}
      {selected && selectedSessions.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-sm text-slate-400">
          No sessions on this day.
        </p>
      )}
      {selectedSessions.length > 0 && (
        <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">
            {new Date(`${selected}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          {selectedSessions.map(s => (
            <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-950">{s.title || s.session_type}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {s.start_time} – {s.end_time}
                    {(s.client?.username || s.consultant?.username)
                      ? ` · ${s.client?.username || s.consultant?.username}`
                      : ''}
                  </p>
                </div>
                <span className={`shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-black capitalize ${STATUS_STYLES[s.status] || 'bg-slate-100 text-slate-600'}`}>
                  {s.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── CLIENT VIEW — booked sessions ───────────────────── */
function ClientAppointments() {
  const [sessions, setSessions] = useState([])
  const [rescheduleRequests, setRescheduleRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('list')
  const [reviewSession, setReviewSession] = useState(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)

  const fetchAll = () => Promise.all([
    api.get('/consultations/sessions/my_sessions/'),
    api.get('/consultations/reschedule-requests/'),
  ]).then(([s, r]) => {
    setSessions(Array.isArray(s.data) ? s.data : s.data.results || [])
    const pending = (Array.isArray(r.data) ? r.data : r.data.results || []).filter(req => req.status === 'pending')
    setRescheduleRequests(pending)
  }).catch(() => {})

  useEffect(() => {
    fetchAll().finally(() => setLoading(false))
  }, [])

  const handleCancel = async (id) => {
    const result = await Swal.fire({
      title: 'Cancel appointment?',
      text: 'This will cancel your booked session.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, cancel it',
      confirmButtonColor: '#dc2626',
      cancelButtonText: 'Keep it',
    })
    if (!result.isConfirmed) return
    try {
      await api.post(`/consultations/sessions/${id}/cancel_session/`)
      setSessions(prev => prev.map(s => s.id === id ? { ...s, status: 'cancelled' } : s))
      Swal.fire({ icon: 'success', title: 'Cancelled', timer: 1500, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'Failed to cancel', text: 'Please try again.' })
    }
  }

  const handleRescheduleRespond = async (reqId, action, message) => {
    try {
      await api.post(`/consultations/reschedule-requests/${reqId}/respond/`, { action, message })
      await fetchAll()
      Swal.fire({
        icon: action === 'approve' ? 'success' : 'info',
        title: action === 'approve' ? 'Reschedule approved!' : 'Reschedule declined',
        timer: 1800, showConfirmButton: false,
      })
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Failed', text: err.response?.data?.detail || 'Please try again.' })
    }
  }

  const openReview = (session) => {
    setReviewSession(session)
    setReviewRating(5)
    setReviewComment('')
  }

  const submitReview = async () => {
    if (!reviewComment.trim()) {
      Swal.fire({ icon: 'warning', title: 'Add a comment', text: 'Please write something about your experience.', timer: 2000, showConfirmButton: false })
      return
    }
    setReviewLoading(true)
    try {
      await api.post('/consultations/reviews/', {
        session: reviewSession.id,
        rating: reviewRating,
        comment: reviewComment.trim(),
      })
      setSessions(prev => prev.map(s =>
        s.id === reviewSession.id ? { ...s, review: { rating: reviewRating, comment: reviewComment } } : s
      ))
      setReviewSession(null)
      Swal.fire({ icon: 'success', title: 'Review submitted!', timer: 1800, showConfirmButton: false })
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'Failed to submit review.'
      Swal.fire({ icon: 'error', title: 'Error', text: msg })
    } finally {
      setReviewLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Your bookings</p>
        <h1 className="mt-1 text-2xl font-black text-slate-950">Appointments</h1>
      </div>

      {/* Pending reschedule requests from consultant */}
      {rescheduleRequests.length > 0 && (
        <div className="rounded-xl border border-orange-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <FaArrowsRotate className="text-orange-500" />
            <h2 className="font-black text-slate-950">Reschedule Requests</h2>
            <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-black text-orange-700">
              {rescheduleRequests.length}
            </span>
          </div>
          <div className="space-y-3">
            {rescheduleRequests.map(req => (
              <RescheduleRequestCard key={req.id} req={req} onRespond={handleRescheduleRespond} />
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <FaCalendarCheck className="text-blue-600" />
          <h2 className="font-black text-slate-950">Booked Sessions</h2>
          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-black text-blue-700">
            {sessions.length}
          </span>
          <div className="ml-auto flex gap-1">
            <button
              onClick={() => setViewMode('list')}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${viewMode === 'list' ? 'border-blue-300 bg-blue-50 text-blue-600' : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}
            >
              <FaList className="text-xs" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${viewMode === 'calendar' ? 'border-blue-300 bg-blue-50 text-blue-600' : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}
            >
              <FaCalendarDays className="text-xs" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <SessionSkeleton key={i} />)}
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <FaCalendarCheck className="text-4xl text-slate-200" />
            <p className="font-black text-slate-500">No appointments yet</p>
            <p className="text-sm text-slate-400">
              Browse consultants and book your first session.
            </p>
          </div>
        ) : viewMode === 'calendar' ? (
          <SessionCalendar sessions={sessions} />
        ) : (
          <div className="space-y-3">
            {sessions.map(session => (
              <div key={session.id} className="rounded-xl border border-slate-100 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <p className="font-black text-slate-950">{session.title || session.session_type}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <FaUser className="text-blue-400" />
                        with {session.consultant?.username}
                      </span>
                      <span className="flex items-center gap-1">
                        <FaClock className="text-blue-400" />
                        {session.scheduled_date} · {session.start_time} – {session.end_time}
                      </span>
                      <span className="flex items-center gap-1">
                        <FaIndianRupeeSign className="text-emerald-500" />
                        {Number(session.session_cost).toLocaleString('en-IN')}
                      </span>
                    </div>
                    {session.description && (
                      <p className="text-xs text-slate-400 line-clamp-2">{session.description}</p>
                    )}
                    {session.review && (
                      <div className="mt-2 flex items-center gap-1.5">
                        {[1,2,3,4,5].map(n => (
                          <FaStar key={n} className={`text-xs ${n <= session.review.rating ? 'text-amber-400' : 'text-slate-200'}`} />
                        ))}
                        <span className="text-xs text-slate-400">"{session.review.comment}"</span>
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <StatusBadge status={session.status} />
                    {(session.status === 'confirmed' || session.status === 'rescheduled') && (
                      <Countdown date={session.scheduled_date} startTime={session.start_time} />
                    )}
                    {session.status === 'pending' && (
                      <button
                        onClick={() => handleCancel(session.id)}
                        className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-black text-rose-600 hover:bg-rose-50"
                      >
                        Cancel
                      </button>
                    )}
                    {session.status === 'completed' && !session.review && (
                      <button
                        onClick={() => openReview(session)}
                        className="flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-black text-amber-700 hover:bg-amber-100"
                      >
                        <FaStar className="text-amber-500" /> Leave Review
                      </button>
                    )}
                    {session.status === 'completed' && session.review && (
                      <span className="flex items-center gap-1 text-xs font-black text-emerald-600">
                        <FaCircleCheck /> Reviewed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review modal */}
      {reviewSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-black text-slate-950">Rate your session</h3>
            <p className="mt-0.5 text-sm text-slate-500">
              Session with <span className="font-black">{reviewSession.consultant?.username}</span>
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">Rating</p>
                <StarRating value={reviewRating} onChange={setReviewRating} />
              </div>
              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">Comment</p>
                <textarea
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  rows={4}
                  placeholder="Share your experience with this consultant..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setReviewSession(null)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-black text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={submitReview}
                disabled={reviewLoading}
                className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-black text-white hover:bg-blue-500 disabled:opacity-60"
              >
                {reviewLoading ? 'Submitting…' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── CONSULTANT / FREELANCER VIEW ─────────────────────── */
function ConsultantAvailability() {
  const [availability, setAvailability] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [newSlot, setNewSlot] = useState({ day_of_week: 'monday', start_time: '09:00', end_time: '10:00', buffer_minutes: 0, max_bookings_per_slot: 1 })
  const [saving, setSaving] = useState(false)
  const [viewMode, setViewMode] = useState('list')
  const [rescheduleSession, setRescheduleSession] = useState(null)

  const fetchSessions = () => api.get('/consultations/sessions/my_sessions/')
    .then(res => setSessions(Array.isArray(res.data) ? res.data : res.data.results || []))
    .catch(() => {})

  useEffect(() => {
    Promise.all([
      api.get('/consultations/availability/'),
      api.get('/consultations/sessions/my_sessions/'),
    ]).then(([avail, sess]) => {
      setAvailability(Array.isArray(avail.data) ? avail.data : avail.data.results || [])
      setSessions(Array.isArray(sess.data) ? sess.data : sess.data.results || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleRescheduleSubmit = async (payload) => {
    try {
      await api.post('/consultations/reschedule-requests/', payload)
      await fetchSessions()
      Swal.fire({ icon: 'success', title: 'Reschedule request sent!', text: 'Client will be notified.', timer: 2000, showConfirmButton: false })
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Failed to send', text: err.response?.data?.detail || 'Please try again.' })
      throw err
    }
  }

  const handleAddSlot = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.post('/consultations/availability/', newSlot)
      setAvailability(prev => [...prev, res.data])
      setNewSlot({ day_of_week: 'monday', start_time: '09:00', end_time: '10:00', buffer_minutes: 0, max_bookings_per_slot: 1 })
      Swal.fire({ icon: 'success', title: 'Slot added!', timer: 1200, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'Failed to add slot', text: 'Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSlot = async (id) => {
    const result = await Swal.fire({
      title: 'Delete this slot?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#dc2626',
    })
    if (!result.isConfirmed) return
    try {
      await api.delete(`/consultations/availability/${id}/`)
      setAvailability(prev => prev.filter(a => a.id !== id))
      Swal.fire({ icon: 'success', title: 'Deleted', timer: 1000, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'Failed to delete', text: 'Please try again.' })
    }
  }

  const handleApprove = async (id) => {
    try {
      await api.post(`/consultations/sessions/${id}/confirm_session/`)
      setSessions(prev => prev.map(s => s.id === id ? { ...s, status: 'confirmed' } : s))
      Swal.fire({ icon: 'success', title: 'Session approved!', timer: 1200, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'Failed to approve', text: 'Please try again.' })
    }
  }

  const handleDecline = async (id) => {
    const result = await Swal.fire({
      title: 'Decline session request?',
      html: `
        <p style="margin-bottom:12px;color:#64748b;font-size:13px;">Optionally provide a reason — the client will see this in their notification.</p>
        <textarea id="swal-decline-reason" placeholder="e.g. Not available on this date, please reschedule." rows="3"
          style="width:100%;padding:10px 12px;border:1px solid #e2e8f0;border-radius:10px;font-size:13px;resize:vertical;outline:none;font-family:inherit;"></textarea>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Decline',
      cancelButtonText: 'Keep it',
      confirmButtonColor: '#dc2626',
      preConfirm: () => {
        return document.getElementById('swal-decline-reason')?.value?.trim() || ''
      },
    })
    if (!result.isConfirmed) return
    try {
      await api.post(`/consultations/sessions/${id}/decline_session/`, { reason: result.value })
      setSessions(prev => prev.map(s => s.id === id ? { ...s, status: 'cancelled' } : s))
      Swal.fire({ icon: 'info', title: 'Session declined', timer: 1200, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'Failed to decline', text: 'Please try again.' })
    }
  }

  const handleConfirm = async (id) => {
    try {
      await api.post(`/consultations/sessions/${id}/confirm_session/`)
      setSessions(prev => prev.map(s => s.id === id ? { ...s, status: 'confirmed' } : s))
      Swal.fire({ icon: 'success', title: 'Session confirmed!', timer: 1200, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'Failed to confirm', text: 'Please try again.' })
    }
  }

  const handleComplete = async (id) => {
    const result = await Swal.fire({
      title: 'Mark as completed?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, complete it',
      confirmButtonColor: '#059669',
    })
    if (!result.isConfirmed) return
    try {
      await api.post(`/consultations/sessions/${id}/complete_session/`)
      setSessions(prev => prev.map(s => s.id === id ? { ...s, status: 'completed' } : s))
      Swal.fire({ icon: 'success', title: 'Session completed!', timer: 1200, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'Failed to complete', text: 'Please try again.' })
    }
  }

  const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">Schedule</p>
        <h1 className="mt-1 text-2xl font-black text-slate-950">Manage Availability</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Add slot */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <FaCalendarPlus className="text-emerald-600" />
            <h2 className="font-black text-slate-950">Add Time Slot</h2>
          </div>
          <form onSubmit={handleAddSlot} className="space-y-4">
            <label className="grid gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500">
              Day
              <select
                value={newSlot.day_of_week}
                onChange={e => setNewSlot(p => ({ ...p, day_of_week: e.target.value }))}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              >
                {DAYS.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500">
                Start
                <input type="time" value={newSlot.start_time}
                  onChange={e => setNewSlot(p => ({ ...p, start_time: e.target.value }))}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                />
              </label>
              <label className="grid gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500">
                End
                <input type="time" value={newSlot.end_time}
                  onChange={e => setNewSlot(p => ({ ...p, end_time: e.target.value }))}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500">
                Buffer (min)
                <select
                  value={newSlot.buffer_minutes}
                  onChange={e => setNewSlot(p => ({ ...p, buffer_minutes: Number(e.target.value) }))}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                >
                  {[0, 15, 30, 60].map(v => <option key={v} value={v}>{v === 0 ? 'None' : `${v} min`}</option>)}
                </select>
              </label>
              <label className="grid gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500">
                Max bookings
                <select
                  value={newSlot.max_bookings_per_slot}
                  onChange={e => setNewSlot(p => ({ ...p, max_bookings_per_slot: Number(e.target.value) }))}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                >
                  {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </label>
            </div>
            <button type="submit" disabled={saving}
              className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-black text-white transition hover:bg-emerald-500 disabled:opacity-60">
              {saving ? 'Adding...' : 'Add Slot'}
            </button>
          </form>
        </div>

        {/* Current slots */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <FaClock className="text-emerald-600" />
            <h2 className="font-black text-slate-950">Current Slots</h2>
            <span className="ml-auto rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-black text-emerald-700">
              {availability.length}
            </span>
          </div>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse flex justify-between rounded-xl bg-slate-50 p-3">
                  <div className="h-4 w-24 rounded bg-slate-200" />
                  <div className="h-4 w-32 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          ) : availability.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No slots added yet.</p>
          ) : (
            <div className="space-y-2">
              {availability.map(slot => (
                <div key={slot.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-black capitalize text-slate-950">{slot.day_of_week}</p>
                    <p className="text-xs text-slate-500">{slot.start_time} – {slot.end_time}</p>
                  </div>
                  <button onClick={() => handleDeleteSlot(slot.id)}
                    className="rounded-lg p-2 text-rose-400 transition hover:bg-rose-50 hover:text-rose-600">
                    <FaTrash className="text-xs" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {rescheduleSession && (
        <RescheduleModal
          session={rescheduleSession}
          onClose={() => setRescheduleSession(null)}
          onSubmit={handleRescheduleSubmit}
        />
      )}

      {/* Sessions */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <FaCalendarCheck className="text-emerald-600" />
          <h2 className="font-black text-slate-950">Incoming Sessions</h2>
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-black text-emerald-700">
            {sessions.length}
          </span>
          <div className="ml-auto flex gap-1">
            <button
              onClick={() => setViewMode('list')}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${viewMode === 'list' ? 'border-emerald-300 bg-emerald-50 text-emerald-600' : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}
            >
              <FaList className="text-xs" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${viewMode === 'calendar' ? 'border-emerald-300 bg-emerald-50 text-emerald-600' : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}
            >
              <FaCalendarDays className="text-xs" />
            </button>
          </div>
        </div>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <SessionSkeleton key={i} />)}
          </div>
        ) : sessions.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No sessions booked yet.</p>
        ) : viewMode === 'calendar' ? (
          <SessionCalendar sessions={sessions} />
        ) : (
          <div className="space-y-3">
            {sessions.map(session => (
              <div key={session.id} className="rounded-xl border border-slate-100 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <p className="font-black text-slate-950">{session.title || session.session_type}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <FaUser className="text-emerald-400" />
                        {session.client?.username}
                      </span>
                      <span className="flex items-center gap-1">
                        <FaClock className="text-emerald-400" />
                        {session.scheduled_date} · {session.start_time} – {session.end_time}
                      </span>
                      <span className="flex items-center gap-1">
                        <FaIndianRupeeSign className="text-emerald-400" />
                        {Number(session.session_cost).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <StatusBadge status={session.status} />
                    {(session.status === 'confirmed' || session.status === 'rescheduled') && (
                      <Countdown date={session.scheduled_date} startTime={session.start_time} />
                    )}
                    {(session.status === 'awaiting_approval' || session.status === 'pending') && (
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleApprove(session.id)}
                          className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-black text-white hover:bg-emerald-500">
                          <FaCircleCheck /> Approve
                        </button>
                        <button onClick={() => handleDecline(session.id)}
                          className="flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-black text-rose-600 hover:bg-rose-50">
                          Decline
                        </button>
                      </div>
                    )}
                    {(session.status === 'confirmed' || session.status === 'rescheduled') && (() => {
                      const sessionEnd = new Date(`${session.scheduled_date}T${session.end_time}`)
                      const canComplete = Date.now() >= sessionEnd.getTime()
                      return (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => canComplete ? handleComplete(session.id) : Swal.fire({ icon: 'info', title: 'Session not over yet', text: `Complete available after ${session.end_time} on ${session.scheduled_date}.`, timer: 2500, showConfirmButton: false })}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-black transition ${canComplete ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50' : 'border-slate-200 text-slate-400 cursor-not-allowed opacity-60'}`}
                          >
                            Complete
                          </button>
                          <button onClick={() => setRescheduleSession(session)}
                            className="flex items-center gap-1 rounded-lg border border-orange-200 px-3 py-1.5 text-xs font-black text-orange-600 hover:bg-orange-50">
                            <FaArrowsRotate className="text-[10px]" /> Reschedule
                          </button>
                        </div>
                      )
                    })()}
                    {session.status === 'reschedule_requested' && (
                      <span className="text-xs font-black text-orange-500">Awaiting client response</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Main export ──────────────────────────────────────── */
export default function ManageAvailability() {
  const { user } = useAuth()
  const role = user?.role

  if (role === 'client') return <ClientAppointments />
  return <ConsultantAvailability />
}
