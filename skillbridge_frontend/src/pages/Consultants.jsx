import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FaMagnifyingGlass, FaUserTie, FaIndianRupeeSign, FaStar, FaCircleCheck } from 'react-icons/fa6'
import api from '../services/api'

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
      <div className="mt-4 flex items-center justify-between">
        <div className="h-5 w-20 rounded bg-slate-100" />
        <div className="h-8 w-24 rounded-xl bg-slate-200" />
      </div>
    </div>
  )
}

export default function Consultants() {
  const [consultants, setConsultants] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    const url = filter === 'my_sessions'
      ? '/consultations/sessions/my_sessions/'
      : '/consultations/sessions/available_consultants/'
    api.get(url)
      .then(res => setConsultants(Array.isArray(res.data) ? res.data : res.data.results || []))
      .catch(() => setConsultants([]))
      .finally(() => setLoading(false))
  }, [filter])

  const filtered = consultants.filter(c => {
    if (!search) return true
    const fullName = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase()
    return (
      c.username?.toLowerCase().includes(search.toLowerCase()) ||
      fullName.includes(search.toLowerCase()) ||
      c.bio?.toLowerCase().includes(search.toLowerCase())
    )
  })

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Directory</p>
        <h1 className="mt-1 text-2xl font-black text-slate-950">Consultants</h1>
      </div>

      {/* Filters + search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'Available Consultants' },
            { key: 'my_sessions', label: 'My Sessions' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-xl px-4 py-2 text-sm font-black transition ${
                filter === f.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <FaMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search consultants..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 sm:w-64"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <ConsultantCardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <FaUserTie className="text-4xl text-slate-300" />
          <div>
            <p className="font-black text-slate-700">No consultants found</p>
            <p className="mt-1 text-sm text-slate-400">
              {search ? 'Try a different search term.' : 'No consultants available right now.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(consultant => {
            const name = consultant.first_name
              ? `${consultant.first_name} ${consultant.last_name || ''}`.trim()
              : consultant.username
            const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

            return (
              <Link key={consultant.id} to={`/consultants/${consultant.username}`} className="group block">
                <article className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md">
                  {/* Avatar + name */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-base font-black text-blue-700">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 truncate font-black text-slate-950">
                        {name}
                        {consultant.kyc_status === 'verified' && (
                          <FaCircleCheck className="shrink-0 text-sm text-emerald-500" title="Verified" />
                        )}
                      </p>
                      <p className="text-xs text-slate-500">@{consultant.username}</p>
                    </div>
                    {consultant.is_featured && (
                      <span className="ml-auto flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-black text-amber-600">
                        <FaStar className="text-[10px]" /> Featured
                      </span>
                    )}
                  </div>

                  {/* Bio */}
                  <p className="mt-3 flex-1 line-clamp-3 text-sm leading-6 text-slate-500">
                    {consultant.bio || 'No bio added yet.'}
                  </p>

                  {/* Footer */}
                  <div className="mt-4 flex items-center justify-between gap-2">
                    {consultant.hourly_rate ? (
                      <span className="flex items-center gap-1 text-sm font-black text-emerald-700">
                        <FaIndianRupeeSign className="text-xs" />
                        {Number(consultant.hourly_rate).toLocaleString('en-IN')}/hr
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Rate on request</span>
                    )}
                    <span className="rounded-xl border border-blue-200 px-3 py-1.5 text-xs font-black text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
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
