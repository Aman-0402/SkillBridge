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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user?.role === 'admin' && user?.is_staff) {
      fetchStats()
    }
  }, [user])

  const fetchStats = async () => {
    try {
      const [statsRes, monthlyRes, growthRes, transactionsRes] = await Promise.all([
        api.get('/chat/analytics/admin_stats/'),
        api.get('/chat/analytics/monthly_payments/'),
        api.get('/chat/analytics/user_growth_chart/'),
        api.get('/chat/analytics/recent_transactions/')
      ])
      console.log('Admin stats response:', statsRes.data)
      console.log('Monthly data response:', monthlyRes.data)
      console.log('User growth response:', growthRes.data)
      console.log('Recent transactions response:', transactionsRes.data)
      setStats(statsRes.data)
      setMonthlyData(monthlyRes.data || [])
      setUserGrowthData(growthRes.data || [])
      setRecentTransactions(transactionsRes.data || [])
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
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only admin users can access this page</p>
          <Link to="/dashboard" className="text-indigo-600 hover:text-indigo-700 mt-4 inline-block">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>
  if (error) return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Dashboard</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
        >
          Retry
        </button>
      </div>
    </div>
  )
  if (!stats) return <div className="text-center py-8 text-gray-600">No statistics available</div>

  const platformStats = stats.platform_stats
  const userGrowth = stats.user_growth

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-gray-600 hover:text-gray-900 text-xl">← Back</Link>
            <h1 className="text-2xl font-bold text-indigo-600">SkillBridge Admin</h1>
          </div>
          <Link to="/admin/panel" className="text-indigo-600 hover:text-indigo-700 font-semibold">Control Panel</Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Platform Analytics</h2>

        {/* Platform Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Users" value={platformStats.total_users} icon="👥" />
          <StatCard title="Total Projects" value={platformStats.total_projects} icon="📊" />
          <StatCard title="Total Jobs" value={platformStats.total_jobs} icon="💼" />
          <StatCard title="Total Payments" value={`$${platformStats.total_payments}`} icon="💰" />
        </div>

        {/* User Role Breakdown - Combined View */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">User Role Breakdown</h3>

          {/* Large Visual Cards (Option 2) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="p-8 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border-2 border-green-300 text-center hover:shadow-lg transition">
              <p className="text-5xl font-bold text-green-900">{platformStats.clients}</p>
              <p className="text-lg font-semibold text-green-700 mt-2">Clients</p>
              <p className="text-sm text-green-600 mt-1">
                {((platformStats.clients / platformStats.total_users) * 100).toFixed(1)}% of total
              </p>
            </div>
            <div className="p-8 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border-2 border-purple-300 text-center hover:shadow-lg transition">
              <p className="text-5xl font-bold text-purple-900">{platformStats.freelancers}</p>
              <p className="text-lg font-semibold text-purple-700 mt-2">Freelancers</p>
              <p className="text-sm text-purple-600 mt-1">
                {((platformStats.freelancers / platformStats.total_users) * 100).toFixed(1)}% of total
              </p>
            </div>
            <div className="p-8 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border-2 border-orange-300 text-center hover:shadow-lg transition">
              <p className="text-5xl font-bold text-orange-900">{platformStats.consultants}</p>
              <p className="text-lg font-semibold text-orange-700 mt-2">Consultants</p>
              <p className="text-sm text-orange-600 mt-1">
                {((platformStats.consultants / platformStats.total_users) * 100).toFixed(1)}% of total
              </p>
            </div>
            <div className="p-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-300 text-center hover:shadow-lg transition">
              <p className="text-5xl font-bold text-blue-900">{platformStats.total_users}</p>
              <p className="text-lg font-semibold text-blue-700 mt-2">Total Users</p>
              <p className="text-sm text-blue-600 mt-1">All registered</p>
            </div>
          </div>

          {/* Detailed Table (Option 3) */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b-2 border-gray-300">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Role</th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-700">Total Users</th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-700">Percentage</th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-700">New This Month</th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-green-50 transition">
                  <td className="px-6 py-4 font-semibold text-gray-900">👤 Clients</td>
                  <td className="px-6 py-4 text-center text-gray-700">{platformStats.clients}</td>
                  <td className="px-6 py-4 text-center text-green-600 font-semibold">
                    {((platformStats.clients / platformStats.total_users) * 100).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 text-center text-gray-700">{userGrowth.by_role.clients}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">Active</span>
                  </td>
                </tr>
                <tr className="border-b hover:bg-purple-50 transition">
                  <td className="px-6 py-4 font-semibold text-gray-900">💼 Freelancers</td>
                  <td className="px-6 py-4 text-center text-gray-700">{platformStats.freelancers}</td>
                  <td className="px-6 py-4 text-center text-purple-600 font-semibold">
                    {((platformStats.freelancers / platformStats.total_users) * 100).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 text-center text-gray-700">{userGrowth.by_role.freelancers}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-semibold">Active</span>
                  </td>
                </tr>
                <tr className="border-b hover:bg-orange-50 transition">
                  <td className="px-6 py-4 font-semibold text-gray-900">🎓 Consultants</td>
                  <td className="px-6 py-4 text-center text-gray-700">{platformStats.consultants}</td>
                  <td className="px-6 py-4 text-center text-orange-600 font-semibold">
                    {((platformStats.consultants / platformStats.total_users) * 100).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 text-center text-gray-700">{userGrowth.by_role.consultants}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-semibold">Active</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* User Distribution Pie Chart */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">User Distribution by Role</h3>
          <div className="flex justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Clients', value: platformStats.clients, fill: '#10b981' },
                    { name: 'Freelancers', value: platformStats.freelancers, fill: '#a855f7' },
                    { name: 'Consultants', value: platformStats.consultants, fill: '#f97316' }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#a855f7" />
                  <Cell fill="#f97316" />
                </Pie>
                <Tooltip formatter={(value) => value} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Revenue Bar Chart */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Monthly Revenue (Last 12 Months)</h3>
          <div className="flex justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                <Bar dataKey="amount" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Growth Line Chart */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">User Growth Trends (Last 12 Months)</h3>
          <div className="flex justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" angle={-45} textAnchor="end" height={80} />
                <YAxis yAxisId="left" label={{ value: 'Total Users', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'New Users', angle: 90, position: 'insideRight' }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="total_users" stroke="#3b82f6" strokeWidth={2} name="Total Users" dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="new_users" stroke="#10b981" strokeWidth={2} name="New Users This Week" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project Stats */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Project Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-gray-600 text-sm">Active Projects</p>
              <p className="text-3xl font-bold text-orange-900">{platformStats.active_projects}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-gray-600 text-sm">Completed Projects</p>
              <p className="text-3xl font-bold text-green-900">{platformStats.completed_projects}</p>
            </div>
            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <p className="text-gray-600 text-sm">Avg Project Budget</p>
              <p className="text-3xl font-bold text-indigo-900">${platformStats.avg_project_budget.toFixed(0)}</p>
            </div>
          </div>
        </div>

        {/* Payment Stats */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Payment Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <p className="text-gray-600 text-sm">Total Payments (Completed)</p>
              <p className="text-3xl font-bold text-emerald-900">${platformStats.total_payments}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-gray-600 text-sm">Total Transactions</p>
              <p className="text-3xl font-bold text-blue-900">{platformStats.total_transactions}</p>
            </div>
            <div className="p-4 bg-cyan-50 rounded-lg border border-cyan-200">
              <p className="text-gray-600 text-sm">Avg Transaction</p>
              <p className="text-3xl font-bold text-cyan-900">
                ${platformStats.total_transactions > 0 ? (platformStats.total_payments / platformStats.total_transactions).toFixed(2) : 0}
              </p>
            </div>
          </div>
        </div>

        {/* Growth Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">User Growth</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-pink-50 rounded-lg border border-pink-200">
              <p className="text-gray-600 text-sm">New Users This Month</p>
              <p className="text-3xl font-bold text-pink-900">{userGrowth.new_users_this_month}</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-gray-600 text-sm">New Users This Week</p>
              <p className="text-3xl font-bold text-red-900">{userGrowth.new_users_this_week}</p>
            </div>
          </div>
        </div>

        {/* Recent Activity Timeline */}
        <div className="bg-white rounded-lg shadow p-6 mt-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Transactions</h3>
          <div className="space-y-4">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction, idx) => (
                <div key={idx} className="flex items-start gap-4 pb-4 border-b last:border-b-0">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-green-100">
                      <span className="text-green-600 font-bold">$</span>
                    </div>
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      Payment of ${transaction.amount.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      From <span className="font-semibold">{transaction.client}</span> to <span className="font-semibold">{transaction.freelancer}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Project: {transaction.project}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {transaction.date} at {transaction.time}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✓ Completed
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">No recent transactions</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-600">
      <p className="text-3xl mb-2">{icon}</p>
      <p className="text-gray-600 text-sm mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}
