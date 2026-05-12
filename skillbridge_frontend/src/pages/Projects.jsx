import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FaFolderPlus, FaFolderOpen, FaMagnifyingGlass } from 'react-icons/fa6'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'

const STATUS_STYLES = {
  open:        'bg-blue-50 text-blue-700',
  in_progress: 'bg-indigo-50 text-indigo-700',
  completed:   'bg-emerald-50 text-emerald-700',
  draft:       'bg-slate-100 text-slate-600',
  closed:      'bg-rose-50 text-rose-600',
}

function ProjectCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="h-5 w-2/3 rounded bg-slate-200" />
          <div className="h-3 w-full rounded bg-slate-100" />
          <div className="h-3 w-4/5 rounded bg-slate-100" />
        </div>
        <div className="h-6 w-20 shrink-0 rounded-lg bg-slate-200" />
      </div>
      <div className="mt-4 flex gap-6">
        <div className="h-3 w-24 rounded bg-slate-100" />
        <div className="h-3 w-20 rounded bg-slate-100" />
        <div className="h-3 w-16 rounded bg-slate-100" />
      </div>
    </div>
  )
}

export default function Projects() {
  const { user } = useAuth()
  const isClient = user?.role === 'client'
  const isAdmin = user?.role === 'admin'

  const [filter, setFilter] = useState(isClient ? 'my_projects' : 'all')
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    const url = filter === 'my_projects' ? '/projects/my_projects/' : '/projects/'
    api.get(url)
      .then(res => setProjects(Array.isArray(res.data) ? res.data : res.data.results || []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false))
  }, [filter])

  const filtered = projects.filter(p =>
    !search || p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
            {isClient ? 'My Work' : 'Browse'}
          </p>
          <h1 className="mt-1 text-2xl font-black text-slate-950">Projects</h1>
        </div>
        {(isClient || isAdmin) && (
          <Link
            to="/create-project"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white shadow-[0_8px_24px_rgba(37,99,235,0.25)] transition hover:-translate-y-0.5 hover:bg-blue-500"
          >
            <FaFolderPlus /> Post a Project
          </Link>
        )}
      </div>

      {/* Filters + search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {(isClient ? ['my_projects'] : ['all', ...(isAdmin ? ['my_projects'] : [])]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-xl px-4 py-2 text-sm font-black transition ${
                filter === f
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              {f === 'all' ? 'All Projects' : 'My Projects'}
            </button>
          ))}
        </div>
        <div className="relative">
          <FaMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title or category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 sm:w-72"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => <ProjectCardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <FaFolderOpen className="text-4xl text-slate-300" />
          <div>
            <p className="font-black text-slate-700">No projects found</p>
            <p className="mt-1 text-sm text-slate-400">
              {search ? 'Try a different search term.' : (isClient || isAdmin) ? 'Post your first project to get started.' : 'Check back soon for new opportunities.'}
            </p>
          </div>
          {(isClient || isAdmin) && !search && (
            <Link to="/create-project" className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white hover:bg-blue-500">
              Post a Project
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(project => (
            <Link key={project.id} to={`/projects/${project.id}`} className="block">
              <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-black text-slate-950">{project.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">{project.description}</p>
                  </div>
                  <span className={`shrink-0 self-start rounded-lg px-3 py-1 text-xs font-black capitalize ${STATUS_STYLES[project.status] || 'bg-slate-100 text-slate-600'}`}>
                    {project.status?.replace('_', ' ')}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs font-semibold text-slate-500">
                  <span>₹{Number(project.budget).toLocaleString('en-IN')} · {project.budget_type}</span>
                  {project.category && <span>📁 {project.category}</span>}
                  {project.duration && <span>⏱ {project.duration}</span>}
                  <span>{project.proposal_count ?? 0} proposal{project.proposal_count !== 1 ? 's' : ''}</span>
                  {project.client?.username && <span>by {project.client.username}</span>}
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
