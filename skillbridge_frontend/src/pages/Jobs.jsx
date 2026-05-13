import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FaBriefcase, FaMagnifyingGlass, FaPlus, FaChevronLeft, FaChevronRight } from 'react-icons/fa6'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'

const PAGE_SIZE = 8

const JOB_TYPE_STYLES = {
  full_time:  'bg-blue-100 text-blue-700',
  part_time:  'bg-indigo-100 text-indigo-700',
  contract:   'bg-amber-100 text-amber-700',
  freelance:  'bg-emerald-100 text-emerald-700',
  internship: 'bg-purple-100 text-purple-700',
}
const EXP_STYLES = {
  entry:    'bg-slate-100 text-slate-600',
  mid:      'bg-cyan-100 text-cyan-700',
  senior:   'bg-rose-100 text-rose-700',
  expert:   'bg-orange-100 text-orange-700',
}

function JobCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="h-5 w-2/3 rounded bg-slate-200" />
          <div className="h-3 w-1/3 rounded bg-slate-100" />
          <div className="h-3 w-full rounded bg-slate-100" />
          <div className="h-3 w-4/5 rounded bg-slate-100" />
        </div>
        <div className="h-6 w-20 shrink-0 rounded-lg bg-slate-200" />
      </div>
      <div className="mt-4 flex gap-3">
        <div className="h-5 w-20 rounded-full bg-slate-100" />
        <div className="h-5 w-16 rounded-full bg-slate-100" />
      </div>
    </div>
  )
}

function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  const visible = pages.filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
  return (
    <div className="flex items-center justify-center gap-1">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <FaChevronLeft className="text-xs" />
      </button>
      {visible.reduce((acc, p, idx) => {
        if (idx > 0 && p - visible[idx - 1] > 1) {
          acc.push(<span key={`gap-${p}`} className="px-1 text-sm text-slate-400">…</span>)
        }
        acc.push(
          <button
            key={p}
            onClick={() => onPage(p)}
            className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black transition ${
              p === page
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
            }`}
          >{p}</button>
        )
        return acc
      }, [])}
      <button
        onClick={() => onPage(page + 1)}
        disabled={page === totalPages}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <FaChevronRight className="text-xs" />
      </button>
    </div>
  )
}

export default function Jobs() {
  const { user } = useAuth()
  const isClient = user?.role === 'client'
  const isAdmin = user?.role === 'admin'

  const [filter, setFilter] = useState('all')
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    setLoading(true)
    const url = filter === 'my_jobs' ? '/jobs/my_jobs/' : '/jobs/'
    api.get(url)
      .then(res => setJobs(Array.isArray(res.data) ? res.data : res.data.results || []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false))
  }, [filter])

  useEffect(() => { setPage(1) }, [filter, search])

  const formatSalary = (min, max) => {
    if (!min && !max) return 'Competitive'
    if (min && max) return `₹${Number(min).toLocaleString('en-IN')} – ₹${Number(max).toLocaleString('en-IN')}`
    if (min) return `From ₹${Number(min).toLocaleString('en-IN')}`
    return `Up to ₹${Number(max).toLocaleString('en-IN')}`
  }

  const filtered = jobs.filter(j =>
    !search ||
    j.title?.toLowerCase().includes(search.toLowerCase()) ||
    j.company?.toLowerCase().includes(search.toLowerCase()) ||
    j.location?.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">
            {isClient ? 'My Work' : 'Browse'}
          </p>
          <h1 className="mt-1 text-2xl font-black text-slate-950">Jobs</h1>
        </div>
        {(isClient || isAdmin) && (
          <Link
            to="/post-job"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-black text-white shadow-[0_8px_24px_rgba(79,70,229,0.25)] transition hover:-translate-y-0.5 hover:bg-indigo-500"
          >
            <FaPlus /> Post a Job
          </Link>
        )}
      </div>

      {/* Filters + search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {['all', ...(isClient || isAdmin ? ['my_jobs'] : [])].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-xl px-4 py-2 text-sm font-black transition ${
                filter === f
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
              }`}
            >
              {f === 'all' ? 'All Jobs' : 'My Jobs'}
            </button>
          ))}
        </div>
        <div className="relative">
          <FaMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, company, or location..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 sm:w-80"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => <JobCardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <FaBriefcase className="text-4xl text-slate-300" />
          <div>
            <p className="font-black text-slate-700">No jobs found</p>
            <p className="mt-1 text-sm text-slate-400">
              {search ? 'Try a different search term.' : (isClient || isAdmin) ? 'Post your first job listing.' : 'Check back soon for new opportunities.'}
            </p>
          </div>
          {(isClient || isAdmin) && !search && (
            <Link to="/post-job" className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-black text-white hover:bg-indigo-500">
              Post a Job
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {paginated.map(job => (
              <Link key={job.id} to={`/jobs/${job.id}`} className="block">
                <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-base font-black text-slate-950">{job.title}</h3>
                      <p className="mt-0.5 text-sm font-semibold text-slate-500">
                        {job.company}{job.company && job.location ? ' · ' : ''}{job.location}
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{job.description}</p>
                    </div>
                    <span className={`shrink-0 self-start rounded-lg px-3 py-1 text-xs font-black capitalize ${
                      job.status === 'open' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">
                      {formatSalary(job.salary_min, job.salary_max)}
                    </span>
                    <span className="text-slate-300">·</span>
                    {job.job_type && (
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-black capitalize ${JOB_TYPE_STYLES[job.job_type] || 'bg-slate-100 text-slate-600'}`}>
                        {job.job_type?.replace('_', ' ')}
                      </span>
                    )}
                    {job.experience_level && (
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-black capitalize ${EXP_STYLES[job.experience_level] || 'bg-slate-100 text-slate-600'}`}>
                        {job.experience_level}
                      </span>
                    )}
                    {job.application_count != null && (
                      <span className="ml-auto text-xs font-semibold text-slate-400">
                        {job.application_count} application{job.application_count !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </article>
              </Link>
            ))}
          </div>
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs font-semibold text-slate-400">
              {filtered.length} job{filtered.length !== 1 ? 's' : ''} · page {page} of {totalPages || 1}
            </p>
            <Pagination page={page} totalPages={totalPages} onPage={setPage} />
          </div>
        </>
      )}
    </div>
  )
}
