import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [monthlyData, setMonthlyData] = useState([])
  const [userGrowthData, setUserGrowthData] = useState([])
  const [recentTransactions, setRecentTransactions] = useState([])
  const [kpis, setKpis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user?.role === 'admin' && user?.is_staff) {
      fetchStats()
    }
  }, [user])

  const fetchStats = async () => {
    try {
      const [statsRes, monthlyRes, growthRes, transactionsRes, kpisRes] = await Promise.all([
        api.get('/chat/analytics/admin_stats/'),
        api.get('/chat/analytics/monthly_payments/'),
        api.get('/chat/analytics/user_growth_chart/'),
        api.get('/chat/analytics/recent_transactions/'),
        api.get('/chat/analytics/kpis/')
      ])
      console.log('Admin stats response:', statsRes.data)
      console.log('Monthly data response:', monthlyRes.data)
      console.log('User growth response:', growthRes.data)
      console.log('Recent transactions response:', transactionsRes.data)
      console.log('KPIs response:', kpisRes.data)
      setStats(statsRes.data)
      setMonthlyData(monthlyRes.data || [])
      setUserGrowthData(growthRes.data || [])
      setRecentTransactions(transactionsRes.data || [])
      setKpis(kpisRes.data)
      setError(null)
    } catch (error) {
      const errorMsg = error.response?.data?.detail || error.message || 'Unknown error'
      console.error('Failed to fetch admin stats:', errorMsg)
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  if (user?.role !== 'admin' || !user?.is_staff) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-4xl font-black text-slate-200">403</p>
        <p className="mt-2 font-black text-slate-700">Access Denied</p>
        <p className="mt-1 text-sm text-slate-500">Only admin staff can view this page.</p>
        <Link to="/dashboard" className="mt-4 text-sm font-black text-blue-600 hover:underline">← Back to Dashboard</Link>
      </div>
    )
  }

  if (loading) return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-3 w-16 animate-pulse rounded bg-slate-200" />
          <div className="h-7 w-48 animate-pulse rounded-lg bg-slate-200" />
        </div>
        <div className="h-10 w-36 animate-pulse rounded-xl bg-slate-200" />
      </div>
      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="h-3 w-24 rounded bg-slate-100" />
            <div className="mt-3 h-8 w-16 rounded-lg bg-slate-200" />
            <div className="mt-2 h-3 w-20 rounded bg-slate-100" />
          </div>
        ))}
      </div>
      {/* Chart skeletons */}
      {[300, 260, 280].map((h, i) => (
        <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 h-5 w-48 rounded bg-slate-200" />
          <div className={`w-full rounded-lg bg-slate-100`} style={{ height: h }} />
        </div>
      ))}
    </div>
  )
  if (error) return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="font-black text-rose-600">Failed to load analytics</p>
      <p className="mt-1 text-sm text-slate-500">{error}</p>
      <button onClick={fetchStats} className="mt-4 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white hover:bg-blue-500">
        Retry
      </button>
    </div>
  )
  if (!stats) return <div className="py-16 text-center text-sm text-slate-500">No statistics available</div>

  const platformStats = stats.platform_stats
  const userGrowth = stats.user_growth

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Admin</p>
          <h1 className="mt-1 text-2xl font-black text-slate-950">Platform Analytics</h1>
        </div>
        <Link
          to="/admin/panel"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-black text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-600"
        >
          Control Panel →
        </Link>
      </div>

      {/* ── Platform Stat Cards ── */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          { label: 'Total Users',    value: platformStats.total_users,    sub: 'Registered accounts', color: 'text-blue-600',    bg: 'bg-blue-50' },
          { label: 'Total Projects', value: platformStats.total_projects,  sub: 'All time',            color: 'text-violet-600',  bg: 'bg-violet-50' },
          { label: 'Total Jobs',     value: platformStats.total_jobs,      sub: 'Posted',              color: 'text-amber-600',   bg: 'bg-amber-50' },
          { label: 'Total Revenue',  value: `₹${Number(platformStats.total_payments).toLocaleString('en-IN')}`, sub: 'Completed payments', color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map(({ label, value, sub, color, bg }) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
            <p className={`mt-2 text-2xl font-black ${color}`}>{value}</p>
            <p className="mt-1 text-xs text-slate-400">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── KPI Cards ── */}
      {kpis && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="mb-5 font-black text-slate-950">Key Performance Indicators</p>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {[
              { label: 'Conversion Rate',  value: `${kpis.conversion_rate}%`,                                                                    sub: 'Proposals accepted',  color: 'text-blue-600' },
              { label: 'Avg Project Value',value: `₹${Number(kpis.avg_project_value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,    sub: 'Average budget',      color: 'text-emerald-600' },
              { label: 'Platform Health',  value: `${kpis.platform_health_score}%`,                                                              sub: 'Overall score',       color: 'text-violet-600' },
              { label: 'Total Revenue',    value: `₹${Number(kpis.revenue_split.total).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,  sub: 'All sources',         color: 'text-amber-600' },
            ].map(({ label, value, sub, color }) => (
              <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
                <p className={`mt-2 text-xl font-black ${color}`}>{value}</p>
                <p className="mt-1 text-xs text-slate-400">{sub}</p>
              </div>
            ))}
          </div>

          {/* Revenue Split */}
          <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-5">
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Project Revenue</p>
              <p className="mt-1 text-lg font-black text-blue-700">₹{Number(kpis.revenue_split.projects).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Consultation Revenue</p>
              <p className="mt-1 text-lg font-black text-emerald-700">₹{Number(kpis.revenue_split.consultations).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
            </div>
          </div>

          {/* Top Performers */}
          <div className="mt-5 grid gap-5 border-t border-slate-100 pt-5 md:grid-cols-2">
            <div>
              <p className="mb-3 text-sm font-black text-slate-950">Top Freelancers</p>
              <div className="space-y-2">
                {kpis.top_freelancers.length > 0 ? kpis.top_freelancers.map((f, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <div>
                      <p className="text-sm font-black text-slate-900">{i + 1}. {f.username}</p>
                      <p className="text-xs text-slate-500">{f.projects_completed} projects</p>
                    </div>
                    <span className="text-sm font-black text-violet-600">₹{Number(f.earned).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                  </div>
                )) : <p className="text-sm text-slate-400">No data yet</p>}
              </div>
            </div>
            <div>
              <p className="mb-3 text-sm font-black text-slate-950">Top Consultants</p>
              <div className="space-y-2">
                {kpis.top_consultants.length > 0 ? kpis.top_consultants.map((c, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <div>
                      <p className="text-sm font-black text-slate-900">{i + 1}. {c.username}</p>
                      <p className="text-xs text-slate-500">{c.sessions_completed} sessions</p>
                    </div>
                    <span className="text-sm font-black text-amber-600">₹{Number(c.earned).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                  </div>
                )) : <p className="text-sm text-slate-400">No data yet</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── User Role Breakdown ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="mb-5 font-black text-slate-950">User Role Breakdown</p>
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {[
            { label: 'Clients',     count: platformStats.clients,     color: 'text-blue-600',   border: 'border-blue-100',   bg: 'bg-blue-50' },
            { label: 'Freelancers', count: platformStats.freelancers,  color: 'text-violet-600', border: 'border-violet-100', bg: 'bg-violet-50' },
            { label: 'Consultants', count: platformStats.consultants,  color: 'text-amber-600',  border: 'border-amber-100',  bg: 'bg-amber-50' },
            { label: 'Total',       count: platformStats.total_users,  color: 'text-slate-700',  border: 'border-slate-200',  bg: 'bg-slate-50' },
          ].map(({ label, count, color, border, bg }) => (
            <div key={label} className={`rounded-xl border ${border} ${bg} p-5 text-center`}>
              <p className={`text-3xl font-black ${color}`}>{count}</p>
              <p className="mt-1 text-sm font-black text-slate-600">{label}</p>
              {label !== 'Total' && (
                <p className="mt-0.5 text-xs text-slate-400">
                  {((count / platformStats.total_users) * 100).toFixed(1)}% of total
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-5 overflow-x-auto border-t border-slate-100 pt-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {['Role', 'Total', '%', 'New This Month', ''].map(h => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-black uppercase tracking-wide text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[
                { icon: '👤', role: 'Clients',     count: platformStats.clients,    new: userGrowth.by_role.clients,     badge: 'bg-blue-100 text-blue-700' },
                { icon: '💼', role: 'Freelancers', count: platformStats.freelancers, new: userGrowth.by_role.freelancers, badge: 'bg-violet-100 text-violet-700' },
                { icon: '🎓', role: 'Consultants', count: platformStats.consultants, new: userGrowth.by_role.consultants, badge: 'bg-amber-100 text-amber-700' },
              ].map(({ icon, role, count, new: newCount, badge }) => (
                <tr key={role} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 font-black text-slate-900">{icon} {role}</td>
                  <td className="px-4 py-3 font-semibold text-slate-700">{count}</td>
                  <td className="px-4 py-3 font-semibold text-slate-500">{((count / platformStats.total_users) * 100).toFixed(1)}%</td>
                  <td className="px-4 py-3 font-semibold text-slate-700">+{newCount}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-black ${badge}`}>Active</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Charts row ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pie chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="mb-4 font-black text-slate-950">User Distribution</p>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={[
                { name: 'Clients', value: platformStats.clients },
                { name: 'Freelancers', value: platformStats.freelancers },
                { name: 'Consultants', value: platformStats.consultants },
              ]} cx="50%" cy="50%" outerRadius={90} dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                <Cell fill="#3b82f6" />
                <Cell fill="#7c3aed" />
                <Cell fill="#d97706" />
              </Pie>
              <Tooltip formatter={(v) => v} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Project + Payment mini stats */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="mb-4 font-black text-slate-950">Project Status</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Active',    value: platformStats.active_projects,    color: 'text-amber-600' },
                { label: 'Completed', value: platformStats.completed_projects,  color: 'text-emerald-600' },
                { label: 'Avg Budget',value: `₹${Number(platformStats.avg_project_budget).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, color: 'text-blue-600' },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
                  <p className={`text-lg font-black ${color}`}>{value}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="mb-4 font-black text-slate-950">Payments</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total Paid',     value: `₹${Number(platformStats.total_payments).toLocaleString('en-IN')}`, color: 'text-emerald-600' },
                { label: 'Transactions',   value: platformStats.total_transactions,                                    color: 'text-blue-600' },
                { label: 'Avg',            value: `₹${platformStats.total_transactions > 0 ? Number(platformStats.total_payments / platformStats.total_transactions).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : 0}`, color: 'text-violet-600' },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
                  <p className={`text-lg font-black ${color}`}>{value}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="mb-4 font-black text-slate-950">User Growth</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'This Month', value: userGrowth.new_users_this_month, color: 'text-blue-600' },
                { label: 'This Week',  value: userGrowth.new_users_this_week,  color: 'text-violet-600' },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
                  <p className={`text-2xl font-black ${color}`}>+{value}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Monthly Revenue Chart ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="mb-4 font-black text-slate-950">Monthly Revenue — Last 12 Months</p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" angle={-45} textAnchor="end" height={70} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => `₹${Number(v).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} />
            <Bar dataKey="amount" fill="#3b82f6" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── User Growth Chart ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="mb-4 font-black text-slate-950">User Growth Trends — Last 12 Months</p>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={userGrowthData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="week" angle={-45} textAnchor="end" height={70} tick={{ fontSize: 11 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="total_users" stroke="#3b82f6" strokeWidth={2} name="Total Users" dot={false} />
            <Line yAxisId="right" type="monotone" dataKey="new_users" stroke="#10b981" strokeWidth={2} name="New Users" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── Recent Transactions ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="mb-5 font-black text-slate-950">Recent Transactions</p>
        {recentTransactions.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {recentTransactions.map((t, i) => (
              <div key={i} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-sm font-black text-emerald-600">₹</div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-slate-900">₹{Number(t.amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                  <p className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">{t.client}</span> → <span className="font-semibold text-slate-700">{t.freelancer}</span>
                    {t.project && ` · ${t.project}`}
                  </p>
                  <p className="text-xs text-slate-400">{t.date} {t.time}</p>
                </div>
                <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">Completed</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-slate-400">No recent transactions</p>
        )}
      </div>
    </div>
  )
}
