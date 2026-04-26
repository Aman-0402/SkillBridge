import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.is_staff) {
      fetchStats()
    }
  }, [user])

  const fetchStats = async () => {
    try {
      const response = await api.get('/chat/analytics/admin_stats/')
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch admin stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user?.is_staff) {
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
  if (!stats) return <div className="text-center py-8 text-gray-600">Failed to load statistics</div>

  const platformStats = stats.platform_stats
  const userGrowth = stats.user_growth

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">SkillBridge Admin</h1>
          <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">Back to Dashboard</Link>
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

        {/* User Breakdown */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">User Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-gray-600 text-sm">Clients</p>
              <p className="text-3xl font-bold text-blue-900">{platformStats.clients}</p>
              <p className="text-xs text-gray-600 mt-2">
                New this month: {userGrowth.by_role.clients}
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-gray-600 text-sm">Freelancers</p>
              <p className="text-3xl font-bold text-green-900">{platformStats.freelancers}</p>
              <p className="text-xs text-gray-600 mt-2">
                New this month: {userGrowth.by_role.freelancers}
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-gray-600 text-sm">Consultants</p>
              <p className="text-3xl font-bold text-purple-900">{platformStats.consultants}</p>
              <p className="text-xs text-gray-600 mt-2">
                New this month: {userGrowth.by_role.consultants}
              </p>
            </div>
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
