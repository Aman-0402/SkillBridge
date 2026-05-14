import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  FaMagnifyingGlass, FaUserTie, FaIndianRupeeSign, FaStar,
  FaCircleCheck, FaCircle, FaCalendarCheck, FaXmark,
  FaSliders, FaChevronDown,
} from 'react-icons/fa6'
import api from '../services/api'

const SESSION_TYPES = [
  { value: '', label: 'Any' },
  { value: 'call', label: 'Phone Call' },
  { value: 'video', label: 'Video Call' },
  { value: 'email', label: 'Email' },
  { value: 'in_person', label: 'In Person' },
]

function ConsultantCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 shrink-0 rounded-full bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 rounded bg-slate-200" />
          <div className="h-3 w-20 rounded bg-slate-100" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full rounded bg-slate-100" />
        <div className="h-3 w-4/5 rounded bg-slate-100" />
      </div>
      <div className="mt-3 flex gap-1.5">
        {[60, 80, 50].map(w => <div key={w} className="h-5 rounded-full bg-slate-100" style={{ width: w }} />)}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="h-5 w-20 rounded bg-slate-100" />
        <div className="h-8 w-24 rounded-xl bg-slate-200" />
      </div>
    </div>
  )
}

function NextSlotBadge({ slot }) {
  if (!slot) return null
  const label = slot.days_from_now === 0
    ? 'Today'
    : slot.days_from_now === 1
    ? 'Tomorrow'
    : slot.day.charAt(0).toUpperCase() + slot.day.slice(1)
  return (
    <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-black text-emerald-700">
      <FaCalendarCheck className="text-[10px]" />
      {label} {slot.start_time.slice(0, 5)}
    </span>
  )
}

export default function Consultants() {
  const [consultants, setConsultants] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [onlineOnly, setOnlineOnly] = useState(false)
  const [availableToday, setAvailableToday] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [minRate, setMinRate] = useState('')
  const [maxRate, setMaxRate] = useState('')
  const [language, setLanguage] = useState('')
  const [sessionType, setSessionType] = useState('')
  const [minRating, setMinRating] = useState('')
  const [experienceMin, setExperienceMin] = useState('')
  const debounceRef = useRef(null)

  const buildParams = (overrides = {}) => {
    const base = {
      search: search || undefined,
      online: onlineOnly ? 'true' : undefined,
      available_today: availableToday ? 'true' : undefined,
      min_rate: minRate || undefined,
      max_rate: maxRate || undefined,
      language: language || undefined,
      session_type: sessionType || undefined,
      min_rating: minRating || undefined,
      experience_min: experienceMin || undefined,
    }
    const merged = { ...base, ...overrides }
    return Object.fromEntries(Object.entries(merged).filter(([, v]) => v !== undefined))
  }

  const fetchConsultants = useCallback((params = {}) => {
    setLoading(true)
    api.get('/consultations/sessions/available_consultants/', { params })
      .then(res => setConsultants(Array.isArray(res.data) ? res.data : res.data.results || []))
      .catch(() => setConsultants([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchConsultants()
  }, [fetchConsultants])

  const triggerSearch = (overrides = {}) => {
    fetchConsultants(buildParams(overrides))
  }

  const handleSearchChange = (e) => {
    const val = e.target.value
    setSearch(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchConsultants(buildParams({ search: val || undefined })), 350)
  }

  const handleOnlineToggle = () => {
    const next = !onlineOnly
    setOnlineOnly(next)
    fetchConsultants(buildParams({ online: next ? 'true' : undefined }))
  }

  const handleTodayToggle = () => {
    const next = !availableToday
    setAvailableToday(next)
    fetchConsultants(buildParams({ available_today: next ? 'true' : undefined }))
  }

  const applyAdvanced = () => {
    fetchConsultants(buildParams())
  }

  const clearFilters = () => {
    setSearch('')
    setOnlineOnly(false)
    setAvailableToday(false)
    setMinRate('')
    setMaxRate('')
    setLanguage('')
    setSessionType('')
    setMinRating('')
    setExperienceMin('')
    fetchConsultants()
  }

  const hasAdvancedFilters = minRate || maxRate || language || sessionType || minRating || experienceMin
  const hasFilters = search || onlineOnly || availableToday || hasAdvancedFilters

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Directory</p>
        <h1 className="mt-1 text-2xl font-black text-slate-950">Find Consultants</h1>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <FaMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, skill, expertise, industry…"
              value={search}
              onChange={handleSearchChange}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleOnlineToggle}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-black transition ${
                onlineOnly ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-600'
              }`}
            >
              <FaCircle className={`text-[8px] ${onlineOnly ? 'text-emerald-500' : 'text-slate-300'}`} />
              Online Now
            </button>
            <button
              onClick={handleTodayToggle}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-black transition ${
                availableToday ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              <FaCalendarCheck className="text-xs" />
              Today
            </button>
            <button
              onClick={() => setShowAdvanced(v => !v)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-black transition ${
                showAdvanced || hasAdvancedFilters ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <FaSliders className="text-xs" />
              Filters
              {hasAdvancedFilters && <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[9px] font-black text-white">!</span>}
              <FaChevronDown className={`text-[10px] transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>
            {hasFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2.5 text-sm font-black text-rose-500 hover:bg-rose-50">
                <FaXmark /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Advanced filter panel */}
        {showAdvanced && (
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-4">
            <p className="text-xs font-black uppercase tracking-wide text-indigo-600">Advanced Filters</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              <div>
                <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-500">Min Rate (₹/hr)</label>
                <input type="number" min="0" value={minRate} onChange={e => setMinRate(e.target.value)} placeholder="e.g. 500" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-500">Max Rate (₹/hr)</label>
                <input type="number" min="0" value={maxRate} onChange={e => setMaxRate(e.target.value)} placeholder="e.g. 5000" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-500">Language</label>
                <input type="text" value={language} onChange={e => setLanguage(e.target.value)} placeholder="e.g. English" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-500">Session Type</label>
                <select value={sessionType} onChange={e => setSessionType(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100">
                  {SESSION_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-500">Min Rating</label>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(star => (
                    <button key={star} type="button" onClick={() => setMinRating(minRating == star ? '' : String(star))}
                      className={`flex-1 rounded-lg border py-1.5 text-xs font-black transition ${minRating == star ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-slate-200 bg-white text-slate-400 hover:border-amber-300'}`}>
                      {star}★
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-500">Experience (yrs)</label>
                <select value={experienceMin} onChange={e => setExperienceMin(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100">
                  <option value="">Any</option>
                  <option value="1">1+ years</option>
                  <option value="3">3+ years</option>
                  <option value="5">5+ years</option>
                  <option value="10">10+ years</option>
                </select>
              </div>
            </div>
            <button onClick={applyAdvanced} className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-black text-white hover:bg-indigo-500">
              Apply Filters
            </button>
          </div>
        )}

        {/* Active filter chips */}
        {hasFilters && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400">Active:</span>
            {search && <span className="rounded-full bg-slate-100 px-2.5 py-1 font-black text-slate-600">"{search}"</span>}
            {onlineOnly && <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-black text-emerald-700">Online now</span>}
            {availableToday && <span className="rounded-full bg-blue-100 px-2.5 py-1 font-black text-blue-700">Available today</span>}
            {minRate && <span className="rounded-full bg-indigo-100 px-2.5 py-1 font-black text-indigo-700">Min ₹{minRate}</span>}
            {maxRate && <span className="rounded-full bg-indigo-100 px-2.5 py-1 font-black text-indigo-700">Max ₹{maxRate}</span>}
            {language && <span className="rounded-full bg-indigo-100 px-2.5 py-1 font-black text-indigo-700">Lang: {language}</span>}
            {sessionType && <span className="rounded-full bg-indigo-100 px-2.5 py-1 font-black text-indigo-700">{SESSION_TYPES.find(s => s.value === sessionType)?.label}</span>}
            {minRating && <span className="rounded-full bg-amber-100 px-2.5 py-1 font-black text-amber-700">{minRating}★+</span>}
            {experienceMin && <span className="rounded-full bg-indigo-100 px-2.5 py-1 font-black text-indigo-700">{experienceMin}+ yrs</span>}
          </div>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <ConsultantCardSkeleton key={i} />)}
        </div>
      ) : consultants.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <FaUserTie className="text-4xl text-slate-300" />
          <div>
            <p className="font-black text-slate-700">No consultants found</p>
            <p className="mt-1 text-sm text-slate-400">
              {hasFilters ? 'Try different filters or clear search.' : 'No consultants available right now.'}
            </p>
          </div>
          {hasFilters && (
            <button onClick={clearFilters} className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-black text-white hover:bg-blue-500">
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {consultants.map(consultant => {
            const name = consultant.first_name
              ? `${consultant.first_name} ${consultant.last_name || ''}`.trim()
              : consultant.username
            const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
            const tags = [...(consultant.expertise_tags || []), ...(consultant.skills || [])].slice(0, 4)

            return (
              <Link key={consultant.id} to={`/consultants/${consultant.username}`} className="group block">
                <article className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md">

                  {/* Avatar + name + online dot */}
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      {consultant.profile_image ? (
                        <img src={consultant.profile_image} alt={name} className="h-12 w-12 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-base font-black text-blue-700">
                          {initials}
                        </div>
                      )}
                      {consultant.is_online && (
                        <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" title="Online now" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 truncate font-black text-slate-950">
                        {name}
                        {consultant.kyc_status === 'verified' && (
                          <FaCircleCheck className="shrink-0 text-sm text-blue-500" title="KYC Verified" />
                        )}
                      </p>
                      <p className="text-xs text-slate-500">@{consultant.username}</p>
                      {/* Role badge */}
                      {consultant.role === 'both' && (
                        <span className="mt-0.5 inline-flex rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                          Freelancer + Consultant
                        </span>
                      )}
                      {/* Rating */}
                      {consultant.avg_rating && (
                        <div className="mt-0.5 flex items-center gap-1">
                          <FaStar className="text-[10px] text-amber-400" />
                          <span className="text-xs font-black text-amber-600">{consultant.avg_rating}</span>
                          <span className="text-xs text-slate-400">({consultant.total_sessions} sessions)</span>
                        </div>
                      )}
                    </div>
                    {consultant.is_featured && (
                      <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-black text-amber-600">
                        ⭐ Featured
                      </span>
                    )}
                  </div>

                  {/* Bio */}
                  <p className="mt-3 flex-1 line-clamp-2 text-sm leading-6 text-slate-500">
                    {consultant.bio || 'No bio added yet.'}
                  </p>

                  {/* Tags */}
                  {tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {tags.map((tag, i) => (
                        <span key={i} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-black text-slate-600">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Next slot + rate */}
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <div className="flex flex-col gap-1">
                      {consultant.hourly_rate ? (
                        <span className="flex items-center gap-1 text-sm font-black text-emerald-700">
                          <FaIndianRupeeSign className="text-xs" />
                          {Number(consultant.hourly_rate).toLocaleString('en-IN')}/hr
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Rate on request</span>
                      )}
                      <NextSlotBadge slot={consultant.next_available_slot} />
                    </div>
                    <span className="shrink-0 rounded-xl border border-blue-200 px-3 py-1.5 text-xs font-black text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                      Book Session →
                    </span>
                  </div>
                </article>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
