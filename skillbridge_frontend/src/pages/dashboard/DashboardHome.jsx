import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FaCalendarCheck, FaFolderPlus, FaMagnifyingGlass,
  FaUserTie, FaUser, FaShieldHalved, FaFolderOpen,
  FaIndianRupeeSign, FaChartLine, FaCircleCheck, FaHourglass,
  FaArrowRight, FaChartPie,
} from 'react-icons/fa6'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import Button from '../../components/ui/Button'
import { useAuth } from '../../hooks/useAuth'
import api from '../../services/api'

/* ─── Role config ─────────────────────────────────────────── */
const ROLE_CONFIG = {
  client: {
    badge: 'Solution Seeker', badgeColor: 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/30',
    icon: FaUser, headline: (n) => `Welcome back, ${n}!`,
    sub: 'Find experts, post projects, and manage your consultations.',
    actions: [
      { label: 'Browse Consultants', to: '/consultants', icon: FaMagnifyingGlass, primary: true },
      { label: 'Create Project', to: '/create-project', icon: FaFolderPlus, primary: false },
    ],
  },
  freelancer: {
    badge: 'Freelancer / Consultant', badgeColor: 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30',
    icon: FaUserTie, headline: (n) => `Welcome back, ${n}!`,
    sub: 'Browse projects, manage proposals, and grow your consulting career.',
    actions: [
      { label: 'Browse Projects', to: '/projects', icon: FaMagnifyingGlass, primary: true },
      { label: 'Manage Availability', to: '/manage-availability', icon: FaCalendarCheck, primary: false },
    ],
  },
  consultant: {
    badge: 'Consultant', badgeColor: 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30',
    icon: FaUserTie, headline: (n) => `Welcome back, ${n}!`,
    sub: 'Manage your sessions, availability, and client consultations.',
    actions: [
      { label: 'My Sessions', to: '/manage-availability', icon: FaCalendarCheck, primary: true },
      { label: 'Browse Projects', to: '/projects', icon: FaMagnifyingGlass, primary: false },
    ],
  },
  both: {
    badge: 'Freelancer + Consultant', badgeColor: 'bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/30',
    icon: FaUserTie, headline: (n) => `Welcome back, ${n}!`,
    sub: 'Your combined workspace — bid on projects and accept consulting sessions.',
    actions: [
      { label: 'Browse Projects', to: '/projects', icon: FaMagnifyingGlass, primary: true },
      { label: 'My Sessions', to: '/manage-availability', icon: FaCalendarCheck, primary: false },
    ],
  },
  admin: {
    badge: 'Admin', badgeColor: 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/30',
    icon: FaShieldHalved, headline: (n) => `Welcome, ${n}!`,
    sub: 'Monitor platform activity, manage users, and review analytics.',
    actions: [
      { label: 'Admin Dashboard', to: '/admin/dashboard', icon: FaChartPie, primary: true },
      { label: 'Admin Panel', to: '/admin/panel', icon: FaShieldHalved, primary: false },
    ],
  },
}

/* ─── Stat card config ────────────────────────────────────── */
function formatCurrency(val) {
  return val ? `₹${Number(val).toLocaleString('en-IN')}` : '₹0'
}

function buildStatCards(role, stats) {
  if (!stats) return []
  if (role === 'client') return [
    { label: 'Active Projects', value: stats.active_projects ?? 0, icon: FaFolderOpen, color: 'text-blue-600', bg: 'bg-blue-50', trend: `${stats.projects_this_month ?? 0} this month` },
    { label: 'Total Projects', value: stats.total_projects ?? 0, icon: FaChartLine, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: `${stats.completed_projects ?? 0} completed` },
    { label: 'Total Spent', value: formatCurrency(stats.total_spent), icon: FaIndianRupeeSign, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: `Avg ₹${Number(stats.avg_project_budget ?? 0).toLocaleString('en-IN')} / project` },
    { label: 'Proposals Received', value: stats.total_proposals ?? 0, icon: FaHourglass, color: 'text-amber-600', bg: 'bg-amber-50', trend: `${stats.active_proposals ?? 0} pending review` },
  ]
  if (role === 'freelancer') return [
    { label: 'Total Proposals', value: stats.total_proposals ?? 0, icon: FaFolderOpen, color: 'text-blue-600', bg: 'bg-blue-50', trend: `${stats.proposals_this_month ?? 0} this month` },
    { label: 'Accepted', value: stats.accepted_proposals ?? 0, icon: FaCircleCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: `${stats.success_rate ?? 0}% success rate` },
    { label: 'Total Earned', value: formatCurrency(stats.total_earned), icon: FaIndianRupeeSign, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: `${stats.completed_projects ?? 0} projects done` },
    { label: 'Pending', value: stats.pending_proposals ?? 0, icon: FaHourglass, color: 'text-amber-600', bg: 'bg-amber-50', trend: 'Awaiting response' },
  ]
  if (role === 'consultant') return [
    { label: 'Total Sessions', value: stats.total_sessions ?? 0, icon: FaCalendarCheck, color: 'text-blue-600', bg: 'bg-blue-50', trend: `${stats.sessions_this_month ?? 0} this month` },
    { label: 'Completed', value: stats.completed_sessions ?? 0, icon: FaCircleCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: `${stats.confirmed_sessions ?? 0} confirmed` },
    { label: 'Total Earned', value: formatCurrency(stats.total_earned), icon: FaIndianRupeeSign, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: `Avg ₹${Number(stats.avg_session_cost ?? 0).toLocaleString('en-IN')} / session` },
    { label: 'Total Clients', value: stats.total_clients ?? 0, icon: FaUser, color: 'text-amber-600', bg: 'bg-amber-50', trend: `${stats.pending_sessions ?? 0} pending` },
  ]
  if (role === 'both') return [
    { label: 'Total Proposals', value: stats.total_proposals ?? 0, icon: FaFolderOpen, color: 'text-blue-600', bg: 'bg-blue-50', trend: `${stats.proposals_this_month ?? 0} this month` },
    { label: 'Total Sessions', value: stats.total_sessions ?? 0, icon: FaCalendarCheck, color: 'text-purple-600', bg: 'bg-purple-50', trend: `${stats.sessions_this_month ?? 0} this month` },
    { label: 'Total Earned', value: formatCurrency(stats.total_earned), icon: FaIndianRupeeSign, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: `Freelance + Consulting` },
    { label: 'Total Clients', value: stats.total_clients ?? 0, icon: FaUser, color: 'text-amber-600', bg: 'bg-amber-50', trend: `${stats.success_rate ?? 0}% proposal success` },
  ]
  return [
    { label: 'Total Users', value: stats.total_users ?? 0, icon: FaUser, color: 'text-blue-600', bg: 'bg-blue-50', trend: `${stats.clients ?? 0} clients · ${stats.freelancers ?? 0} freelancers` },
    { label: 'Active Projects', value: stats.active_projects ?? 0, icon: FaFolderOpen, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: `${stats.completed_projects ?? 0} completed` },
    { label: 'Platform Revenue', value: formatCurrency(stats.total_payments), icon: FaIndianRupeeSign, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: `${stats.total_transactions ?? 0} transactions` },
    { label: 'Active Jobs', value: stats.active_jobs ?? 0, icon: FaChartLine, color: 'text-amber-600', bg: 'bg-amber-50', trend: `${stats.total_jobs ?? 0} total posted` },
  ]
}

/* ─── Status badge ────────────────────────────────────────── */
const STATUS_STYLES = {
  open: 'bg-blue-50 text-blue-700', in_progress: 'bg-indigo-50 text-indigo-700',
  completed: 'bg-emerald-50 text-emerald-700', draft: 'bg-slate-100 text-slate-600',
  submitted: 'bg-amber-50 text-amber-700', accepted: 'bg-emerald-50 text-emerald-700',
  withdrawn: 'bg-rose-50 text-rose-600', pending: 'bg-amber-50 text-amber-700',
  confirmed: 'bg-blue-50 text-blue-700', cancelled: 'bg-rose-50 text-rose-600',
}
function StatusBadge({ status }) {
  return (
    <span className={`rounded-lg px-2.5 py-1 text-xs font-black capitalize ${STATUS_STYLES[status] || 'bg-slate-100 text-slate-600'}`}>
      {status?.replace('_', ' ')}
    </span>
  )
}

/* ─── Skeletons ───────────────────────────────────────────── */
function StatSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="h-4 w-28 rounded bg-slate-200" />
        <div className="h-9 w-9 rounded-lg bg-slate-200" />
      </div>
      <div className="mt-4 h-8 w-20 rounded bg-slate-200" />
      <div className="mt-2 h-3 w-36 rounded bg-slate-100" />
    </div>
  )
}
function PanelSkeleton({ rows = 3 }) {
  return (
    <div className="animate-pulse space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-xl border border-slate-100 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="h-4 w-48 rounded bg-slate-200" />
            <div className="h-6 w-16 rounded-lg bg-slate-100" />
          </div>
          <div className="mt-2 h-3 w-32 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  )
}

/* ─── Role-specific bottom panels ────────────────────────── */
function ClientPanels() {
  const [consultants, setConsultants] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/auth/featured-consultants/'),
      api.get('/projects/my_projects/'),
    ]).then(([c, p]) => {
      setConsultants(c.data.slice(0, 4))
      setProjects(p.data.slice(0, 4))
    }).finally(() => setLoading(false))
  }, [])

  return (
    <section className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-950">Featured Consultants</h2>
            <p className="mt-0.5 text-sm text-slate-500">Hand-picked experts ready to help.</p>
          </div>
          <Link to="/consultants" className="flex items-center gap-1 text-xs font-black text-blue-600 hover:text-blue-700">
            View all <FaArrowRight />
          </Link>
        </div>
        <div className="mt-4 divide-y divide-slate-100">
          {loading ? <PanelSkeleton rows={3} /> : consultants.length === 0
            ? <p className="py-6 text-center text-sm text-slate-400">No featured consultants yet. Admin can feature consultants from the Admin Panel.</p>
            : consultants.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-black text-blue-700">
                    {(c.first_name?.[0] || c.username?.[0] || '?').toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-950">{c.first_name ? `${c.first_name} ${c.last_name}` : c.username}</p>
                    <p className="text-xs text-slate-500 line-clamp-1">{c.bio || 'Consultant'}</p>
                  </div>
                </div>
                <Link to={`/consultants/${c.username}`} className="shrink-0 rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-black text-blue-600 hover:bg-blue-50">
                  Book
                </Link>
              </div>
            ))
          }
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-950">My Projects</h2>
            <p className="mt-0.5 text-sm text-slate-500">Your recent project activity.</p>
          </div>
          <Link to="/projects" className="flex items-center gap-1 text-xs font-black text-blue-600 hover:text-blue-700">
            View all <FaArrowRight />
          </Link>
        </div>
        <div className="mt-4 space-y-3">
          {loading ? <PanelSkeleton rows={3} /> : projects.length === 0
            ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <FaFolderOpen className="text-3xl text-slate-300" />
                <p className="text-sm text-slate-400">No projects yet.</p>
                <Link to="/create-project" className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-black text-white hover:bg-blue-500">
                  Create your first project
                </Link>
              </div>
            )
            : projects.map((p) => (
              <Link key={p.id} to={`/projects/${p.id}`} className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 p-4 transition hover:border-blue-200 hover:bg-blue-50/40">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-950">{p.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">₹{Number(p.budget).toLocaleString('en-IN')} · {p.proposal_count} proposals</p>
                </div>
                <StatusBadge status={p.status} />
              </Link>
            ))
          }
        </div>
      </div>
    </section>
  )
}

function FreelancerPanels() {
  const [proposals, setProposals] = useState([])
  const [openProjects, setOpenProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/proposals/my_proposals/'),
      api.get('/projects/'),
    ]).then(([pr, proj]) => {
      setProposals(pr.data.slice(0, 4))
      setOpenProjects(proj.data.filter(p => p.status === 'open').slice(0, 4))
    }).finally(() => setLoading(false))
  }, [])

  return (
    <section className="grid gap-6 xl:grid-cols-[0.85fr_1fr]">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-950">My Proposals</h2>
            <p className="mt-0.5 text-sm text-slate-500">Track your submitted bids.</p>
          </div>
          <Link to="/projects" className="flex items-center gap-1 text-xs font-black text-emerald-600 hover:text-emerald-700">
            Browse <FaArrowRight />
          </Link>
        </div>
        <div className="mt-4 space-y-3">
          {loading ? <PanelSkeleton rows={3} /> : proposals.length === 0
            ? <p className="py-6 text-center text-sm text-slate-400">No proposals submitted yet.</p>
            : proposals.map((pr) => (
              <div key={pr.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-950">{pr.project?.title || `Project #${pr.project}`}</p>
                  <p className="mt-0.5 text-xs text-slate-500">Bid: ₹{Number(pr.bid_amount).toLocaleString('en-IN')}</p>
                </div>
                <StatusBadge status={pr.status} />
              </div>
            ))
          }
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-950">Open Projects</h2>
            <p className="mt-0.5 text-sm text-slate-500">New opportunities to bid on.</p>
          </div>
          <Link to="/projects" className="flex items-center gap-1 text-xs font-black text-emerald-600 hover:text-emerald-700">
            View all <FaArrowRight />
          </Link>
        </div>
        <div className="mt-4 space-y-3">
          {loading ? <PanelSkeleton rows={3} /> : openProjects.length === 0
            ? <p className="py-6 text-center text-sm text-slate-400">No open projects right now.</p>
            : openProjects.map((p) => (
              <Link key={p.id} to={`/projects/${p.id}`} className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/40">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-950">{p.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">₹{Number(p.budget).toLocaleString('en-IN')} · {p.proposal_count} bids</p>
                </div>
                <span className="shrink-0 rounded-lg border border-emerald-200 px-2.5 py-1 text-xs font-black text-emerald-600">
                  Bid →
                </span>
              </Link>
            ))
          }
        </div>
      </div>
    </section>
  )
}

function ConsultantPanels() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/consultations/sessions/my_sessions/')
      .then(res => setSessions(res.data.slice(0, 5)))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="grid gap-6 xl:grid-cols-[1fr_0.7fr]">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-950">My Sessions</h2>
            <p className="mt-0.5 text-sm text-slate-500">Upcoming and recent consultations.</p>
          </div>
          <Link to="/manage-availability" className="flex items-center gap-1 text-xs font-black text-emerald-600 hover:text-emerald-700">
            Manage <FaArrowRight />
          </Link>
        </div>
        <div className="mt-4 space-y-3">
          {loading ? <PanelSkeleton rows={4} /> : sessions.length === 0
            ? <p className="py-6 text-center text-sm text-slate-400">No sessions yet.</p>
            : sessions.map((s) => (
              <div key={s.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-950">{s.title || s.session_type}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {s.client?.username} · {s.scheduled_date} · ₹{Number(s.session_cost).toLocaleString('en-IN')}
                  </p>
                </div>
                <StatusBadge status={s.status} />
              </div>
            ))
          }
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Link to="/manage-availability" className="flex flex-1 flex-col justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-5 transition hover:bg-emerald-100">
          <FaCalendarCheck className="text-2xl text-emerald-600" />
          <div className="mt-4">
            <p className="font-black text-slate-950">Manage Availability</p>
            <p className="mt-1 text-sm text-slate-500">Set your working hours and booking slots.</p>
          </div>
          <span className="mt-4 flex items-center gap-1 text-xs font-black text-emerald-700">
            Update schedule <FaArrowRight />
          </span>
        </Link>
        <Link to="/projects" className="flex flex-1 flex-col justify-between rounded-xl border border-blue-200 bg-blue-50 p-5 transition hover:bg-blue-100">
          <FaMagnifyingGlass className="text-2xl text-blue-600" />
          <div className="mt-4">
            <p className="font-black text-slate-950">Browse Projects</p>
            <p className="mt-1 text-sm text-slate-500">Find new freelance projects to bid on.</p>
          </div>
          <span className="mt-4 flex items-center gap-1 text-xs font-black text-blue-700">
            Explore projects <FaArrowRight />
          </span>
        </Link>
      </div>
    </section>
  )
}

/* ─── Revenue Chart ──────────────────────────────────────── */
function RevenueChart({ role }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/chat/analytics/my_revenue_chart/')
      .then(res => setData(Array.isArray(res.data) ? res.data : []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [])

  const hasData = data.some(d => d.total > 0)
  const showBothLines = role === 'both'

  function formatINR(val) {
    return `₹${Number(val).toLocaleString('en-IN')}`
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-950">Revenue — Last 6 Months</h2>
          <p className="mt-0.5 text-sm text-slate-500">Your earnings from projects and sessions.</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">
          <FaIndianRupeeSign className="text-[10px]" />
          {formatINR(data.reduce((sum, d) => sum + (d.total || 0), 0))} total
        </span>
      </div>

      {loading ? (
        <div className="h-52 animate-pulse rounded-xl bg-slate-100" />
      ) : !hasData ? (
        <div className="flex h-52 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 text-center">
          <FaChartLine className="text-2xl text-slate-300" />
          <p className="text-sm text-slate-400">No earnings yet. Complete projects or sessions to see your revenue chart.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradFreelance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradConsulting" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} width={55} />
            <Tooltip
              formatter={(val, name) => [formatINR(val), name.charAt(0).toUpperCase() + name.slice(1)]}
              contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 700 }}
            />
            {showBothLines ? (
              <>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />
                <Area type="monotone" dataKey="freelance" name="Freelance" stroke="#10b981" strokeWidth={2} fill="url(#gradFreelance)" dot={false} />
                <Area type="monotone" dataKey="consulting" name="Consulting" stroke="#8b5cf6" strokeWidth={2} fill="url(#gradConsulting)" dot={false} />
              </>
            ) : (
              <Area type="monotone" dataKey="total" name="Revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#gradTotal)" dot={{ r: 3, fill: '#6366f1' }} activeDot={{ r: 5 }} />
            )}
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

function BothPanels() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-black text-purple-700">Freelance Work</span>
      </div>
      <FreelancerPanels />
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">Consulting</span>
      </div>
      <ConsultantPanels />
    </div>
  )
}

function AdminPanels({ stats }) {
  return (
    <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
      {[
        { label: 'Clients', value: stats?.clients ?? '—', color: 'border-blue-200 bg-blue-50', text: 'text-blue-700', to: '/admin/panel' },
        { label: 'Freelancers', value: stats?.freelancers ?? '—', color: 'border-emerald-200 bg-emerald-50', text: 'text-emerald-700', to: '/admin/panel' },
        { label: 'Consultants', value: stats?.consultants ?? '—', color: 'border-indigo-200 bg-indigo-50', text: 'text-indigo-700', to: '/admin/panel' },
        { label: 'Total Jobs', value: stats?.total_jobs ?? '—', color: 'border-amber-200 bg-amber-50', text: 'text-amber-700', to: '/jobs' },
      ].map((card) => (
        <Link key={card.label} to={card.to} className={`rounded-xl border p-5 transition hover:-translate-y-0.5 ${card.color}`}>
          <p className="text-sm font-bold text-slate-500">{card.label}</p>
          <strong className={`mt-2 block text-4xl font-black ${card.text}`}>{card.value}</strong>
          <span className="mt-1 flex items-center gap-1 text-xs font-black text-slate-400">
            View in panel <FaArrowRight />
          </span>
        </Link>
      ))}
    </section>
  )
}

/* ─── Main component ──────────────────────────────────────── */
function DashboardHome() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)

  const role = user?.role || 'client'
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.client
  const displayName = user?.first_name || user?.username || 'there'
  const RoleIcon = config.icon

  useEffect(() => {
    api.get('/chat/analytics/dashboard_stats/')
      .then(res => setStats(res.data.stats))
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false))
  }, [])

  const statCards = buildStatCards(role, stats)

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <section className="rounded-xl bg-slate-950 p-6 text-white shadow-xl shadow-slate-300/20 sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ${config.badgeColor}`}>
              <RoleIcon className="text-[10px]" />
              {config.badge}
            </span>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">{config.headline(displayName)}</h2>
            <p className="mt-4 max-w-2xl text-slate-300">{config.sub}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            {config.actions.map((action) => {
              const Icon = action.icon
              return (
                <Button key={action.to} to={action.to} variant={action.primary ? 'primary' : 'secondary'}>
                  <Icon /> {action.label}
                </Button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Stat cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statsLoading
          ? Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
          : statCards.map((card) => {
              const Icon = card.icon
              return (
                <article key={card.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-slate-500">{card.label}</p>
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${card.bg}`}>
                      <Icon className={`text-base ${card.color}`} />
                    </span>
                  </div>
                  <strong className="mt-3 block text-3xl font-black text-slate-950">{card.value}</strong>
                  <span className="mt-1.5 block text-xs font-semibold text-slate-400">{card.trend}</span>
                </article>
              )
            })
        }
      </section>

      {/* Revenue chart — freelancer / consultant / both only */}
      {['freelancer', 'consultant', 'both'].includes(role) && <RevenueChart role={role} />}

      {/* Role-specific panels */}
      {role === 'client' && <ClientPanels />}
      {role === 'freelancer' && <FreelancerPanels />}
      {role === 'consultant' && <ConsultantPanels />}
      {role === 'both' && <BothPanels />}
      {role === 'admin' && <AdminPanels stats={stats} />}
    </div>
  )
}

export default DashboardHome
