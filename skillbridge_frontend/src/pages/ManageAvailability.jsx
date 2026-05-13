import { useState, useEffect } from 'react'
import {
  FaCalendarCheck, FaCalendarPlus, FaTrash, FaCircleCheck,
  FaClock, FaUser, FaIndianRupeeSign, FaStar,
} from 'react-icons/fa6'
import Swal from 'sweetalert2'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'

/* ─── Status badge ─────────────────────────────────────── */
const STATUS_STYLES = {
  pending:   'bg-amber-50 text-amber-700',
  confirmed: 'bg-blue-50 text-blue-700',
  completed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-rose-50 text-rose-600',
}
function StatusBadge({ status }) {
  return (
    <span className={`rounded-lg px-2.5 py-1 text-xs font-black capitalize ${STATUS_STYLES[status] || 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
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

/* ─── CLIENT VIEW — booked sessions ───────────────────── */
function ClientAppointments() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [reviewSession, setReviewSession] = useState(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)

  useEffect(() => {
    api.get('/consultations/sessions/my_sessions/')
      .then(res => setSessions(Array.isArray(res.data) ? res.data : res.data.results || []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false))
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

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <FaCalendarCheck className="text-blue-600" />
          <h2 className="font-black text-slate-950">Booked Sessions</h2>
          <span className="ml-auto rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-black text-blue-700">
            {sessions.length}
          </span>
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
  const [newSlot, setNewSlot] = useState({ day_of_week: 'monday', start_time: '09:00', end_time: '10:00' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get('/consultations/availability/'),
      api.get('/consultations/sessions/my_sessions/'),
    ]).then(([avail, sess]) => {
      setAvailability(Array.isArray(avail.data) ? avail.data : avail.data.results || [])
      setSessions(Array.isArray(sess.data) ? sess.data : sess.data.results || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleAddSlot = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.post('/consultations/availability/', newSlot)
      setAvailability(prev => [...prev, res.data])
      setNewSlot({ day_of_week: 'monday', start_time: '09:00', end_time: '10:00' })
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

      {/* Sessions */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <FaCalendarCheck className="text-emerald-600" />
          <h2 className="font-black text-slate-950">Incoming Sessions</h2>
          <span className="ml-auto rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-black text-emerald-700">
            {sessions.length}
          </span>
        </div>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <SessionSkeleton key={i} />)}
          </div>
        ) : sessions.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No sessions booked yet.</p>
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
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusBadge status={session.status} />
                    {session.status === 'pending' && (
                      <button onClick={() => handleConfirm(session.id)}
                        className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-black text-white hover:bg-emerald-500">
                        <FaCircleCheck /> Confirm
                      </button>
                    )}
                    {session.status === 'confirmed' && (
                      <button onClick={() => handleComplete(session.id)}
                        className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-black text-emerald-700 hover:bg-emerald-50">
                        Complete
                      </button>
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
