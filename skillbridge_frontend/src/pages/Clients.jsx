import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  FaMagnifyingGlass, FaUser, FaFolderOpen, FaLocationDot,
  FaCircle, FaIndianRupeeSign, FaArrowRight,
} from 'react-icons/fa6'
import api from '../services/api'

function ClientCardSkeleton() {
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
      <div className="mt-4 space-y-2">
        <div className="h-10 w-full rounded-xl bg-slate-100" />
        <div className="h-10 w-full rounded-xl bg-slate-100" />
      </div>
    </div>
  )
}

function Avatar({ client }) {
  const initials = (
    client.first_name ? client.first_name[0] : client.username[0]
  ).toUpperCase()
  if (client.profile_picture) {
    return (
      <img
        src={client.profile_picture}
        alt={client.username}
        className="h-12 w-12 shrink-0 rounded-full object-cover"
        onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
      />
    )
  }
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-base font-black text-blue-700">
      {initials}
    </div>
  )
}

export default function Clients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [withOpenProjects, setWithOpenProjects] = useState(false)
  const debounceRef = useRef(null)

  const fetchClients = useCallback((params = {}) => {
    setLoading(true)
    api.get('/auth/clients/', { params })
      .then(res => setClients(Array.isArray(res.data) ? res.data : []))
      .catch(() => setClients([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchClients() }, [fetchClients])

  const handleSearch = (val) => {
    setSearch(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchClients({ search: val || undefined })
    }, 350)
  }

  const displayed = withOpenProjects
    ? clients.filter(c => c.open_project_count > 0)
    : clients

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Directory</p>
        <h1 className="mt-1 text-2xl font-black text-slate-950">Clients</h1>
        <p className="mt-1 text-sm text-slate-500">Browse clients actively posting projects.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={() => setWithOpenProjects(v => !v)}
          className={`rounded-xl px-4 py-2 text-sm font-black transition ${
            withOpenProjects
              ? 'bg-blue-600 text-white shadow-sm'
              : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600'
          }`}
        >
          {withOpenProjects ? '✓ Open Projects Only' : 'Open Projects Only'}
        </button>
        <div className="relative">
          <FaMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or location..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 sm:w-72"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <ClientCardSkeleton key={i} />)}
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <FaUser className="text-4xl text-slate-300" />
          <div>
            <p className="font-black text-slate-700">No clients found</p>
            <p className="mt-1 text-sm text-slate-400">
              {search ? 'Try a different search term.' : withOpenProjects ? 'No clients with open projects right now.' : 'No clients registered yet.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {displayed.map(client => (
            <div key={client.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md">
              {/* Client header */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar client={client} />
                  {client.is_online && (
                    <FaCircle className="absolute -bottom-0.5 -right-0.5 text-[10px] text-emerald-500 ring-2 ring-white rounded-full" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-black text-slate-950">
                    {client.first_name
                      ? `${client.first_name} ${client.last_name}`.trim()
                      : client.username}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    {client.location && (
                      <span className="flex items-center gap-1 truncate">
                        <FaLocationDot className="shrink-0 text-slate-400" />
                        {client.location}
                      </span>
                    )}
                    {client.is_online && (
                      <span className="shrink-0 font-black text-emerald-600">Online</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio */}
              {client.bio && (
                <p className="mt-3 line-clamp-2 text-sm text-slate-500 leading-relaxed">{client.bio}</p>
              )}

              {/* Stats */}
              <div className="mt-3 flex items-center gap-4 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1">
                  <FaFolderOpen className="text-blue-400" />
                  {client.total_projects} total project{client.total_projects !== 1 ? 's' : ''}
                </span>
                {client.open_project_count > 0 && (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 font-black text-emerald-700">
                    {client.open_project_count} open
                  </span>
                )}
              </div>

              {/* Open projects */}
              {client.open_projects.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Open Projects</p>
                  {client.open_projects.map(p => (
                    <Link
                      key={p.id}
                      to={`/projects/${p.id}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 transition hover:border-blue-200 hover:bg-blue-50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-black text-slate-900">{p.title}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                          <FaIndianRupeeSign className="text-[9px]" />
                          {Number(p.budget).toLocaleString('en-IN')}
                          {p.category && <span className="ml-1 text-slate-400">· {p.category}</span>}
                        </p>
                      </div>
                      <FaArrowRight className="shrink-0 text-[10px] text-slate-400" />
                    </Link>
                  ))}
                </div>
              )}

              {client.open_projects.length === 0 && (
                <p className="mt-4 text-xs text-slate-400">No open projects currently.</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Count footer */}
      {!loading && displayed.length > 0 && (
        <p className="text-center text-xs font-semibold text-slate-400">
          {displayed.length} client{displayed.length !== 1 ? 's' : ''} found
        </p>
      )}
    </div>
  )
}
