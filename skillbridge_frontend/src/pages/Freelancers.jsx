import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  FaMagnifyingGlass, FaBriefcase, FaIndianRupeeSign, FaStar,
  FaCircleCheck, FaCircle, FaXmark, FaCode,
} from 'react-icons/fa6'
import api from '../services/api'

const ROLE_BADGE = {
  freelancer: { label: 'Freelancer',  cls: 'bg-emerald-100 text-emerald-700' },
  both:       { label: 'Freelancer + Consultant', cls: 'bg-purple-100 text-purple-700' },
}

function FreelancerCardSkeleton() {
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

function Avatar({ user }) {
  const initials = [user.first_name?.[0], user.last_name?.[0]].filter(Boolean).join('') || user.username?.[0]?.toUpperCase() || '?'
  return (
    <div className="relative shrink-0">
      {user.profile_image ? (
        <img src={user.profile_image} alt={user.username} className="h-12 w-12 rounded-full object-cover" />
      ) : (
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-black text-sm">
          {initials}
        </div>
      )}
      <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${user.is_online ? 'bg-emerald-400' : 'bg-slate-300'}`} />
    </div>
  )
}

function FreelancerCard({ f }) {
  const name = [f.first_name, f.last_name].filter(Boolean).join(' ') || f.username
  const badge = ROLE_BADGE[f.role] || ROLE_BADGE.freelancer

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Avatar user={f} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="font-black text-slate-900 truncate">{name}</p>
            {f.is_verified && f.kyc_status === 'verified' && (
              <FaCircleCheck className="text-blue-500 shrink-0 text-sm" title="Verified" />
            )}
          </div>
          <p className="text-xs text-slate-500 truncate">@{f.username}</p>
          <span className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.cls}`}>
            {badge.label}
          </span>
        </div>
        {f.hourly_rate && (
          <div className="text-right shrink-0">
            <p className="text-xs text-slate-400">Rate</p>
            <p className="font-black text-slate-900 flex items-center gap-0.5 text-sm">
              <FaIndianRupeeSign className="text-[10px]" />{parseFloat(f.hourly_rate).toLocaleString('en-IN')}<span className="text-xs font-normal text-slate-400">/hr</span>
            </p>
          </div>
        )}
      </div>

      {/* Bio */}
      {f.bio && (
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{f.bio}</p>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <FaBriefcase className="text-emerald-500" />
          {f.completed_projects ?? 0} projects
        </span>
        {f.avg_rating && (
          <span className="flex items-center gap-1">
            <FaStar className="text-amber-400" />
            {f.avg_rating}
          </span>
        )}
        {f.working_industry && (
          <span className="truncate text-slate-400">{f.working_industry}</span>
        )}
      </div>

      {/* Skills */}
      {f.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {f.skills.slice(0, 5).map(s => (
            <span key={s} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">{s}</span>
          ))}
          {f.skills.length > 5 && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-400">+{f.skills.length - 5}</span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-slate-50 mt-auto">
        <Link
          to={`/consultants/${f.username}`}
          className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2 text-center text-xs font-black text-white transition"
        >
          View Profile
        </Link>
        <Link
          to="/projects"
          className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
          title="Post a project for this freelancer"
        >
          Hire
        </Link>
      </div>
    </div>
  )
}

export default function Freelancers() {
  const [freelancers, setFreelancers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [onlineOnly, setOnlineOnly] = useState(false)
  const debounceRef = useRef(null)

  const fetchFreelancers = useCallback((params = {}) => {
    setLoading(true)
    api.get('/auth/freelancers/', { params })
      .then(res => setFreelancers(Array.isArray(res.data) ? res.data : []))
      .catch(() => setFreelancers([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchFreelancers() }, [fetchFreelancers])

  const triggerSearch = (searchVal, online) => {
    const params = {}
    if (searchVal) params.search = searchVal
    if (online) params.online = 'true'
    fetchFreelancers(params)
  }

  const handleSearchChange = (e) => {
    const val = e.target.value
    setSearch(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => triggerSearch(val, onlineOnly), 350)
  }

  const toggleOnline = () => {
    const next = !onlineOnly
    setOnlineOnly(next)
    triggerSearch(search, next)
  }

  const clearSearch = () => {
    setSearch('')
    triggerSearch('', onlineOnly)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">Directory</p>
        <h1 className="mt-1 text-2xl font-black text-slate-950">Find Freelancers</h1>
        <p className="mt-1 text-sm text-slate-500">Browse skilled professionals available for projects</p>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <FaMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input
            type="text"
            placeholder="Search by name, skill, or industry…"
            value={search}
            onChange={handleSearchChange}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
          {search && (
            <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <FaXmark className="text-sm" />
            </button>
          )}
        </div>

        <button
          onClick={toggleOnline}
          className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
            onlineOnly
              ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
          }`}
        >
          <FaCircle className={`text-xs ${onlineOnly ? 'text-emerald-500' : 'text-slate-300'}`} />
          Online now
        </button>
      </div>

      {/* Count */}
      {!loading && (
        <p className="text-xs text-slate-400 font-semibold">
          {freelancers.length} freelancer{freelancers.length !== 1 ? 's' : ''} found
          {search && ` for "${search}"`}
        </p>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }, (_, i) => <FreelancerCardSkeleton key={i} />)
          : freelancers.length === 0
          ? (
            <div className="col-span-full py-16 text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-2xl mb-4">
                <FaCode className="text-slate-400" />
              </div>
              <p className="font-black text-slate-900">No freelancers found</p>
              <p className="mt-1 text-sm text-slate-400">
                {search ? `No results for "${search}". Try different keywords.` : 'No freelancers registered yet.'}
              </p>
              {search && (
                <button onClick={clearSearch} className="mt-4 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-black text-white hover:bg-emerald-700 transition">
                  Clear Search
                </button>
              )}
            </div>
          )
          : freelancers.map(f => <FreelancerCard key={f.id} f={f} />)
        }
      </div>
    </div>
  )
}
