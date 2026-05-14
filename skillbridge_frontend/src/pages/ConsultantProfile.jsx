import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  FaCircleCheck, FaStar, FaCalendarCheck, FaClock, FaGlobe,
  FaIndianRupeeSign, FaLocationDot, FaArrowLeft, FaLinkedin,
  FaGithub, FaXTwitter, FaLink, FaVideo, FaPhone, FaEnvelope,
  FaPerson, FaBriefcase, FaLightbulb, FaUserTie, FaCheck,
  FaChevronRight, FaFlag,
} from 'react-icons/fa6'
import Swal from 'sweetalert2'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

const SESSION_TYPE_META = {
  call:      { label: 'Phone Call', icon: FaPhone,    color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200' },
  video:     { label: 'Video Call', icon: FaVideo,    color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
  email:     { label: 'Email',      icon: FaEnvelope, color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-200' },
  in_person: { label: 'In Person',  icon: FaPerson,   color: 'text-emerald-600',bg: 'bg-emerald-50',border: 'border-emerald-200' },
}

const PROFICIENCY_COLOR = {
  beginner:     'bg-slate-100 text-slate-600',
  intermediate: 'bg-blue-100 text-blue-700',
  expert:       'bg-emerald-100 text-emerald-700',
}

function StarRating({ rating, total }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map(i => (
          <FaStar key={i} className={`text-xs ${i <= Math.round(rating || 0) ? 'text-amber-400' : 'text-slate-200'}`} />
        ))}
      </div>
      {rating && <span className="text-sm font-black text-amber-600">{rating}</span>}
      {total != null && <span className="text-xs text-slate-400">({total} reviews)</span>}
    </div>
  )
}

function RatingBar({ dist, total }) {
  return (
    <div className="space-y-1.5">
      {[5,4,3,2,1].map(star => {
        const count = dist?.[String(star)] || 0
        const pct = total > 0 ? Math.round((count / total) * 100) : 0
        return (
          <div key={star} className="flex items-center gap-2">
            <span className="w-4 text-right text-xs font-bold text-slate-500">{star}</span>
            <FaStar className="text-[10px] text-amber-400" />
            <div className="flex-1 h-1.5 rounded-full bg-slate-100">
              <div className="h-1.5 rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="w-6 text-xs text-slate-400">{count}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function ConsultantProfile() {
  const { username } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [consultant, setConsultant] = useState(null)
  const [availability, setAvailability] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedPkg, setSelectedPkg] = useState(null)
  const [bookingData, setBookingData] = useState({
    session_type: 'video',
    title: '',
    description: '',
    scheduled_date: '',
    start_time: '',
    end_time: '',
    session_cost: '',
  })
  const [booking, setBooking] = useState(false)
  const [sessionRates, setSessionRates] = useState([])
  const [selectedRate, setSelectedRate] = useState(null)
  const [duration, setDuration] = useState(60)
  const [dateWarning, setDateWarning] = useState('')
  const [reportOpen, setReportOpen] = useState(false)
  const [reportData, setReportData] = useState({ reason: '', message: '' })
  const [reportSubmitting, setReportSubmitting] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const profileRes = await api.get(`/auth/profile/${username}/`)
        const data = profileRes.data
        setConsultant(data)
        const availRes = await api.get(`/consultations/availability/consultant_availability/?consultant_id=${data.id}`)
        setAvailability(Array.isArray(availRes.data) ? availRes.data : availRes.data.results || [])
        try {
          const ratesRes = await api.get(`/consultations/session-rates/consultant_rates/?consultant_id=${data.id}`)
          setSessionRates(Array.isArray(ratesRes.data) ? ratesRes.data : [])
        } catch { /* no rates set */ }
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [username])

  const selectPackage = (pkg) => {
    setSelectedPkg(pkg)
    const durationHours = Math.floor(pkg.duration_minutes / 60)
    const durationMins = pkg.duration_minutes % 60
    setBookingData(prev => ({
      ...prev,
      session_type: pkg.session_type,
      session_cost: pkg.price,
      title: pkg.name,
      description: pkg.description || '',
      end_time: prev.start_time ? calcEndTime(prev.start_time, pkg.duration_minutes) : '',
    }))
  }

  const calcEndTime = (startTime, durationMins) => {
    if (!startTime) return ''
    const [h, m] = startTime.split(':').map(Number)
    const totalMins = h * 60 + m + durationMins
    const endH = Math.floor(totalMins / 60) % 24
    const endM = totalMins % 60
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
  }

  const getAvailableWindows = (dateStr) => {
    if (!dateStr) return []
    const dayName = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][new Date(dateStr + 'T00:00:00').getDay()]
    return availability.filter(a => a.day_of_week === dayName && a.is_available)
  }

  const handleBookingChange = (e) => {
    const { name, value } = e.target
    if (name === 'scheduled_date') {
      const windows = getAvailableWindows(value)
      setDateWarning(value && windows.length === 0 ? 'Consultant is not available on this day. Choose another date.' : '')
    }
    setBookingData(prev => {
      const next = { ...prev, [name]: value }
      if (name === 'start_time' && selectedPkg) {
        next.end_time = calcEndTime(value, selectedPkg.duration_minutes)
      }
      if (name === 'start_time' && duration && !selectedPkg) {
        next.end_time = calcEndTime(value, duration)
      }
      return next
    })
  }

  const handleDurationChange = (mins) => {
    setDuration(mins)
    if (bookingData.start_time) {
      setBookingData(prev => ({ ...prev, end_time: calcEndTime(prev.start_time, mins) }))
    }
  }

  const handleSessionTypeSelect = (key) => {
    const rate = sessionRates.find(r => r.session_type === key)
    setSelectedRate(rate || null)
    setBookingData(prev => ({ ...prev, session_type: key }))
  }

  const computedCost = selectedRate
    ? ((Number(selectedRate.hourly_rate) * duration) / 60).toFixed(2)
    : null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) { navigate('/login'); return }
    if (dateWarning) return
    setBooking(true)
    try {
      const payload = {
        ...bookingData,
        consultant: consultant.id,
      }
      // Use rate-based pricing if a rate is selected
      if (selectedRate) {
        payload.rate_id = selectedRate.id
        payload.duration_minutes = duration
        delete payload.session_cost
      }
      const res = await api.post('/consultations/sessions/', payload)
      // Redirect to payment page
      navigate(`/payment/${res.data.id}?type=session`)
    } catch (err) {
      if (err.response?.status === 409) {
        const result = await Swal.fire({
          icon: 'warning',
          title: 'Time Slot Taken',
          text: 'This consultant already has a session at that time. Would you like to book a different slot?',
          showCancelButton: true,
          confirmButtonText: 'Choose Another Slot',
          cancelButtonText: 'Cancel',
          confirmButtonColor: '#2563eb',
        })
        if (!result.isConfirmed) { /* stay on form */ }
      } else {
        Swal.fire({ icon: 'error', title: 'Booking Failed', text: err.response?.data?.detail || 'Could not book session.' })
      }
    } finally {
      setBooking(false)
    }
  }

  const handleReport = async (e) => {
    e.preventDefault()
    if (!reportData.reason || !reportData.message.trim()) return
    setReportSubmitting(true)
    try {
      await api.post('/chat/reports/', {
        reported_user: consultant.id,
        reason: reportData.reason,
        message: reportData.message.trim(),
      })
      setReportOpen(false)
      setReportData({ reason: '', message: '' })
      Swal.fire({ icon: 'success', title: 'Report submitted', text: 'Our team will review it shortly.', timer: 2000, showConfirmButton: false })
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Failed', text: err.response?.data?.detail || 'Could not submit report.' })
    } finally {
      setReportSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-slate-200" />
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-6 h-48" />
            <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-6 h-32" />
          </div>
          <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-6 h-80" />
        </div>
      </div>
    )
  }

  if (!consultant) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <FaUserTie className="text-5xl text-slate-200" />
        <p className="font-black text-slate-700">Consultant not found</p>
        <Link to="/consultants" className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-black text-white hover:bg-blue-500">
          ← Back to Consultants
        </Link>
      </div>
    )
  }

  const name = consultant.first_name
    ? `${consultant.first_name} ${consultant.last_name || ''}`.trim()
    : consultant.username
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const isSelf = user?.id === consultant.id
  const totalReviews = consultant.total_reviews || 0

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'packages', label: `Packages${consultant.packages?.length ? ` (${consultant.packages.length})` : ''}` },
    { id: 'reviews', label: `Reviews${totalReviews ? ` (${totalReviews})` : ''}` },
  ]

  return (
    <div className="space-y-6">
      {/* Report modal */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-black text-slate-950 mb-1">Report this profile</h3>
            <p className="text-xs text-slate-500 mb-4">Reports are reviewed by our admin team. One report per user.</p>
            <form onSubmit={handleReport} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">Reason</label>
                <select
                  required
                  value={reportData.reason}
                  onChange={e => setReportData(p => ({ ...p, reason: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                >
                  <option value="">Select a reason…</option>
                  {[
                    ['spam',          'Spam'],
                    ['fraud',         'Fraud / Scam'],
                    ['harassment',    'Harassment'],
                    ['inappropriate', 'Inappropriate Content'],
                    ['fake_profile',  'Fake Profile'],
                    ['poor_service',  'Poor Service'],
                    ['other',         'Other'],
                  ].map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">Describe the issue</label>
                <textarea
                  required
                  rows={4}
                  value={reportData.message}
                  onChange={e => setReportData(p => ({ ...p, message: e.target.value }))}
                  placeholder="Please provide specific details about your concern…"
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setReportOpen(false); setReportData({ reason: '', message: '' }) }}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-black text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reportSubmitting}
                  className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-black text-white hover:bg-rose-500 transition disabled:opacity-60"
                >
                  {reportSubmitting ? 'Submitting…' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Back link */}
      <Link to="/consultants" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition">
        <FaArrowLeft className="text-xs" /> Back to Consultants
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* ── Left: Profile content ── */}
        <div className="space-y-5">

          {/* Header card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="relative shrink-0">
                {consultant.profile_image ? (
                  <img src={consultant.profile_image} alt={name} className="h-20 w-20 rounded-full object-cover border-4 border-blue-50" />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-600 border-4 border-blue-50 text-xl font-black text-white">
                    {initials}
                  </div>
                )}
                {consultant.is_online && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" title="Online" />
                )}
              </div>

              {/* Name + headline */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-black text-slate-950">{name}</h1>
                  {consultant.kyc_status === 'verified' && (
                    <FaCircleCheck className="text-blue-500 shrink-0" title="KYC Verified" />
                  )}
                  {consultant.is_featured && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-black text-amber-600">⭐ Featured</span>
                  )}
                  {consultant.role === 'both' && (
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">Freelancer + Consultant</span>
                  )}
                </div>
                <p className="text-sm text-slate-500">@{consultant.username}</p>
                {consultant.headline && (
                  <p className="mt-1 text-sm font-semibold text-slate-700">{consultant.headline}</p>
                )}

                {/* Meta row */}
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  {consultant.location && (
                    <span className="flex items-center gap-1"><FaLocationDot className="text-slate-400" />{consultant.location}</span>
                  )}
                  {consultant.timezone && (
                    <span className="flex items-center gap-1"><FaGlobe className="text-slate-400" />{consultant.timezone}</span>
                  )}
                  {consultant.languages && (
                    <span className="flex items-center gap-1">🌐 {consultant.languages}</span>
                  )}
                  {consultant.response_time_hours && (
                    <span className="flex items-center gap-1"><FaClock className="text-slate-400" />Responds in {consultant.response_time_hours}h</span>
                  )}
                </div>
              </div>
            </div>

            {/* Animated stats row */}
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Rating', val: consultant.avg_rating ? `${consultant.avg_rating}★` : 'No ratings', cls: 'text-amber-600' },
                { label: 'Sessions', val: consultant.total_sessions || 0, cls: 'text-blue-600' },
                { label: 'Reviews', val: totalReviews, cls: 'text-indigo-600' },
                { label: 'Experience', val: consultant.years_of_experience ? `${consultant.years_of_experience} yrs` : '—', cls: 'text-emerald-600' },
              ].map(({ label, val, cls }) => (
                <div key={label} className="rounded-xl bg-slate-50 px-3 py-2.5 text-center">
                  <p className={`text-lg font-black ${cls}`}>{val}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
                </div>
              ))}
            </div>

            {/* Social links */}
            {(consultant.linkedin_url || consultant.twitter_url || consultant.github_url || consultant.website_url || consultant.portfolio_url) && (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                {consultant.linkedin_url && <a href={consultant.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"><FaLinkedin /> LinkedIn</a>}
                {consultant.twitter_url && <a href={consultant.twitter_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"><FaXTwitter /> Twitter</a>}
                {consultant.github_url && <a href={consultant.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"><FaGithub /> GitHub</a>}
                {consultant.website_url && <a href={consultant.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"><FaGlobe /> Website</a>}
                {consultant.portfolio_url && <a href={consultant.portfolio_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"><FaLink /> Portfolio</a>}
              </div>
            )}

            {/* Report button — only for logged-in non-admin users */}
            {user && user.role !== 'admin' && user.username !== consultant.username && (
              <div className="mt-3 flex justify-end border-t border-slate-100 pt-3">
                <button
                  onClick={() => setReportOpen(true)}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-500 transition font-semibold"
                >
                  <FaFlag className="text-[10px]" /> Report this profile
                </button>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-black transition ${
                  activeTab === tab.id
                    ? 'bg-white shadow-sm text-slate-950'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Overview tab */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Bio */}
              {consultant.bio && (
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-400">About</p>
                  <p className="text-sm leading-7 text-slate-700">{consultant.bio}</p>
                </div>
              )}

              {/* What I Help With */}
              {consultant.what_i_help_with && (
                <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-5 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <FaLightbulb className="text-amber-500" />
                    <p className="text-sm font-black text-slate-950">What I Help With</p>
                  </div>
                  <p className="text-sm leading-7 text-slate-700">{consultant.what_i_help_with}</p>
                </div>
              )}

              {/* Ideal Client */}
              {consultant.ideal_client && (
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-400">Ideal Client</p>
                  <p className="text-sm leading-7 text-slate-700">{consultant.ideal_client}</p>
                </div>
              )}

              {/* Skills */}
              {consultant.skills?.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-400">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {consultant.skills.map((s, i) => (
                      <span key={i} className={`rounded-full px-3 py-1 text-xs font-black ${PROFICIENCY_COLOR[s.proficiency] || 'bg-slate-100 text-slate-600'}`}>
                        {s.name}
                        {s.proficiency && <span className="ml-1 opacity-60 capitalize">· {s.proficiency}</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Expertise tags */}
              {consultant.expertise_tags?.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-400">Expertise</p>
                  <div className="flex flex-wrap gap-2">
                    {consultant.expertise_tags.map((tag, i) => (
                      <span key={i} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience */}
              {(consultant.working_industry || consultant.years_of_experience || consultant.experience_description || consultant.experiences?.length > 0) && (
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <FaBriefcase className="text-slate-500" />
                    <p className="text-sm font-black text-slate-950">Experience & Background</p>
                  </div>
                  <div className="space-y-2 text-sm text-slate-700">
                    {consultant.working_industry && <p><span className="font-black text-slate-400">Industry: </span>{consultant.working_industry}</p>}
                    {consultant.years_of_experience && <p><span className="font-black text-slate-400">Experience: </span>{consultant.years_of_experience} years</p>}
                    {consultant.experience_description && <p className="mt-2 leading-6">{consultant.experience_description}</p>}
                  </div>
                  {consultant.experiences?.length > 0 && (
                    <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                      {consultant.experiences.map((exp, i) => (
                        <div key={i} className="flex gap-3">
                          <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-400" />
                          <div>
                            <p className="font-black text-slate-900 text-sm">{exp.title}</p>
                            <p className="text-xs text-slate-500">{exp.company} · {exp.start_date?.slice(0, 7)} — {exp.is_current ? 'Present' : exp.end_date?.slice(0, 7) || '—'}</p>
                            {exp.description && <p className="mt-1 text-xs text-slate-600">{exp.description}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Weekly Availability */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FaCalendarCheck className="text-blue-500" />
                    <p className="font-black text-slate-950">Availability</p>
                  </div>
                  {consultant.timezone && (
                    <span className="text-xs text-slate-400"><FaGlobe className="inline mr-1" />{consultant.timezone}</span>
                  )}
                </div>
                {availability.length === 0 ? (
                  <p className="text-sm text-slate-400">No availability set yet.</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                    {DAYS.map(day => {
                      const slots = availability.filter(s => s.day_of_week === day)
                      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
                      const isToday = day === today
                      return (
                        <div key={day} className={`rounded-xl border p-2.5 text-center ${slots.length ? isToday ? 'border-blue-300 bg-blue-50' : 'border-emerald-200 bg-emerald-50/70' : 'border-slate-100 bg-slate-50'}`}>
                          <p className={`text-[10px] font-black uppercase mb-1.5 ${slots.length ? isToday ? 'text-blue-700' : 'text-emerald-700' : 'text-slate-300'}`}>
                            {day.slice(0, 3)}
                            {isToday && <span className="ml-0.5 block text-[8px] text-blue-500">TODAY</span>}
                          </p>
                          {slots.length === 0 ? (
                            <p className="text-[10px] text-slate-300">—</p>
                          ) : (
                            slots.map(s => (
                              <p key={s.id} className="text-[9px] font-semibold text-emerald-700">
                                {s.start_time.slice(0, 5)}<br />{s.end_time.slice(0, 5)}
                              </p>
                            ))
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Packages tab */}
          {activeTab === 'packages' && (
            <div className="space-y-4">
              {!consultant.packages?.length ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center">
                  <p className="font-black text-slate-400">No packages listed yet</p>
                  <p className="mt-1 text-sm text-slate-400">This consultant hasn't added session packages.</p>
                </div>
              ) : (
                consultant.packages.map(pkg => {
                  const meta = SESSION_TYPE_META[pkg.session_type] || SESSION_TYPE_META.video
                  const Icon = meta.icon
                  const isSelected = selectedPkg?.id === pkg.id
                  return (
                    <div
                      key={pkg.id}
                      className={`cursor-pointer rounded-xl border p-5 transition hover:shadow-md ${isSelected ? 'border-blue-400 bg-blue-50/60 shadow-md' : 'border-slate-200 bg-white'}`}
                      onClick={() => selectPackage(pkg)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center justify-center h-7 w-7 rounded-lg ${meta.bg} ${meta.color}`}>
                              <Icon className="text-sm" />
                            </span>
                            <p className="font-black text-slate-950">{pkg.name}</p>
                            {isSelected && <FaCheck className="text-blue-500 text-sm" />}
                          </div>
                          <div className="mt-1.5 flex flex-wrap gap-2">
                            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${meta.bg} ${meta.color}`}>{meta.label}</span>
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">{pkg.duration_minutes} min</span>
                          </div>
                          {pkg.description && <p className="mt-2 text-sm text-slate-500">{pkg.description}</p>}
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-xl font-black text-slate-950">
                            <span className="text-sm"><FaIndianRupeeSign className="inline" /></span>{Number(pkg.price).toLocaleString('en-IN')}
                          </p>
                          {!isSelf && (
                            <button
                              onClick={e => { e.stopPropagation(); selectPackage(pkg); setActiveTab('overview') }}
                              className={`mt-2 flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-black transition ${isSelected ? 'bg-blue-600 text-white' : 'border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white'}`}
                            >
                              {isSelected ? 'Selected' : 'Book →'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              {selectedPkg && !isSelf && (
                <p className="text-center text-sm text-blue-600 font-semibold">
                  <span className="font-black">"{selectedPkg.name}"</span> selected — scroll to the booking panel →
                </p>
              )}
            </div>
          )}

          {/* Reviews tab */}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {/* Summary */}
              {totalReviews > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-4xl font-black text-slate-950">{consultant.avg_rating || '—'}</p>
                      <StarRating rating={consultant.avg_rating} />
                      <p className="mt-1 text-xs text-slate-400">{totalReviews} reviews</p>
                    </div>
                    <div className="flex-1">
                      <RatingBar dist={consultant.rating_distribution} total={totalReviews} />
                    </div>
                  </div>
                </div>
              )}

              {/* Review list */}
              {consultant.recent_reviews?.length === 0 || !consultant.recent_reviews ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white py-12 text-center">
                  <FaStar className="mx-auto mb-3 text-3xl text-slate-200" />
                  <p className="font-black text-slate-400">No reviews yet</p>
                  <p className="mt-1 text-sm text-slate-400">Reviews appear after completed sessions.</p>
                </div>
              ) : (
                consultant.recent_reviews.map((r, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 shrink-0 rounded-full bg-blue-100 flex items-center justify-center text-xs font-black text-blue-700">
                        {r.reviewer_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-black text-slate-950 text-sm">{r.reviewer_name}</p>
                          <span className="text-xs text-slate-400 shrink-0">{r.date}</span>
                        </div>
                        <StarRating rating={r.rating} />
                        {r.comment && <p className="mt-2 text-sm text-slate-600 leading-6">{r.comment}</p>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ── Right: Sticky booking sidebar ── */}
        {!isSelf && (
          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              {/* Rate */}
              <div className="mb-5 flex items-center justify-between">
                <div>
                  {consultant.hourly_rate ? (
                    <p className="text-2xl font-black text-slate-950">
                      <span className="text-base"><FaIndianRupeeSign className="inline" /></span>
                      {Number(consultant.hourly_rate).toLocaleString('en-IN')}
                      <span className="text-sm font-semibold text-slate-400">/hr</span>
                    </p>
                  ) : (
                    <p className="text-sm font-semibold text-slate-400">Rate on request</p>
                  )}
                </div>
                {consultant.avg_rating && (
                  <div className="flex items-center gap-1">
                    <FaStar className="text-sm text-amber-400" />
                    <span className="font-black text-slate-950">{consultant.avg_rating}</span>
                  </div>
                )}
              </div>

              {selectedPkg && (
                <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm">
                  <p className="font-black text-blue-800">{selectedPkg.name}</p>
                  <p className="text-xs text-blue-600">{selectedPkg.duration_minutes} min · ₹{Number(selectedPkg.price).toLocaleString('en-IN')}</p>
                  <button onClick={() => { setSelectedPkg(null); setBookingData(p => ({ ...p, title: '', session_cost: '' })) }} className="mt-1 text-[11px] text-blue-500 hover:text-rose-500">× Remove package</button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-500">Session Type</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {Object.entries(SESSION_TYPE_META).map(([key, meta]) => {
                      const Icon = meta.icon
                      const rate = sessionRates.find(r => r.session_type === key)
                      const isActive = bookingData.session_type === key
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleSessionTypeSelect(key)}
                          className={`flex flex-col items-start gap-0.5 rounded-xl border px-2.5 py-2 text-xs font-bold transition ${
                            isActive ? `${meta.border} ${meta.bg} ${meta.color}` : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                          }`}
                        >
                          <span className="flex items-center gap-1.5"><Icon className="text-sm" /> {meta.label}</span>
                          {rate && <span className="text-[10px] font-black opacity-80">₹{Number(rate.hourly_rate).toLocaleString('en-IN')}/hr</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-500">Session Title *</label>
                  <input
                    name="title"
                    value={bookingData.title}
                    onChange={handleBookingChange}
                    required
                    placeholder="e.g. Career Strategy Session"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-500">What to Discuss</label>
                  <textarea
                    name="description"
                    value={bookingData.description}
                    onChange={handleBookingChange}
                    rows={2}
                    placeholder="Briefly describe your goals…"
                    className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* Duration selector (when rate-based pricing) */}
                {selectedRate && (
                  <div>
                    <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-500">Duration</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {[30, 45, 60, 90, 120].map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => handleDurationChange(m)}
                          className={`rounded-xl border px-3 py-1.5 text-xs font-black transition ${duration === m ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}
                        >
                          {m >= 60 ? `${m / 60}h${m % 60 ? ` ${m % 60}m` : ''}` : `${m}m`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-500">Date *</label>
                  <input
                    type="date"
                    name="scheduled_date"
                    value={bookingData.scheduled_date}
                    onChange={handleBookingChange}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className={`w-full rounded-xl border px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-100 ${dateWarning ? 'border-rose-300 focus:border-rose-400' : 'border-slate-200 focus:border-blue-400'}`}
                  />
                  {dateWarning && <p className="mt-1 text-[11px] text-rose-600 font-semibold">{dateWarning}</p>}
                  {bookingData.scheduled_date && !dateWarning && getAvailableWindows(bookingData.scheduled_date).length > 0 && (
                    <p className="mt-1 text-[11px] text-emerald-600 font-semibold">✓ Available · {getAvailableWindows(bookingData.scheduled_date).map(w => `${w.start_time.slice(0,5)}–${w.end_time.slice(0,5)}`).join(', ')}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-500">Start *</label>
                    <input
                      type="time"
                      name="start_time"
                      value={bookingData.start_time}
                      onChange={handleBookingChange}
                      required
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-500">End *</label>
                    <input
                      type="time"
                      name="end_time"
                      value={bookingData.end_time}
                      onChange={handleBookingChange}
                      required
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                {/* Session cost — computed or manual */}
                {selectedRate && computedCost ? (
                  <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5">
                    <p className="text-[10px] font-black uppercase tracking-wide text-slate-400 mb-1">Session Cost</p>
                    <p className="text-lg font-black text-slate-950">
                      ₹{Number(computedCost).toLocaleString('en-IN')}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      ₹{Number(selectedRate.hourly_rate).toLocaleString('en-IN')}/hr × {duration} min · taxes extra at checkout
                    </p>
                  </div>
                ) : !selectedRate && (
                  <div>
                    <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-500">Session Cost (₹) *</label>
                    <input
                      type="number"
                      name="session_cost"
                      value={bookingData.session_cost}
                      onChange={handleBookingChange}
                      required={!selectedRate}
                      min="0"
                      placeholder={consultant.hourly_rate ? `e.g. ${Math.round(Number(consultant.hourly_rate))}` : '0'}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={booking}
                  className="w-full rounded-xl bg-blue-600 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-500 disabled:opacity-60"
                >
                  {booking ? 'Booking…' : '📅 Book Session'}
                </button>
              </form>
            </div>

            {/* Quick packages shortcut in sidebar */}
            {consultant.packages?.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-400">Quick Packages</p>
                <div className="space-y-2">
                  {consultant.packages.slice(0, 3).map(pkg => {
                    const meta = SESSION_TYPE_META[pkg.session_type] || SESSION_TYPE_META.video
                    const Icon = meta.icon
                    return (
                      <button
                        key={pkg.id}
                        onClick={() => selectPackage(pkg)}
                        className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition hover:border-blue-300 ${selectedPkg?.id === pkg.id ? 'border-blue-400 bg-blue-50' : 'border-slate-100 bg-slate-50'}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon className={`shrink-0 text-sm ${meta.color}`} />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-black text-slate-900">{pkg.name}</p>
                            <p className="text-[10px] text-slate-400">{pkg.duration_minutes}min</p>
                          </div>
                        </div>
                        <span className="shrink-0 text-xs font-black text-emerald-700">₹{Number(pkg.price).toLocaleString('en-IN')}</span>
                      </button>
                    )
                  })}
                  {consultant.packages.length > 3 && (
                    <button onClick={() => setActiveTab('packages')} className="flex w-full items-center justify-center gap-1 text-xs font-black text-blue-600 hover:underline pt-1">
                      View all {consultant.packages.length} packages <FaChevronRight className="text-[10px]" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Self-view: no booking sidebar */}
        {isSelf && (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center lg:self-start">
            <FaUserTie className="mx-auto mb-3 text-3xl text-slate-300" />
            <p className="font-black text-slate-500">This is your profile</p>
            <Link
              to="/profile"
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white hover:bg-blue-500"
            >
              Edit Profile
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
