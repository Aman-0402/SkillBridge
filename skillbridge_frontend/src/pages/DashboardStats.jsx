import { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'

export default function DashboardStats() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await api.get('/chat/analytics/dashboard_stats/')
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>

  // Redirect admin users to admin dashboard
  if (user?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />
  }

  if (!stats) return <div className="text-center py-8 text-gray-600">Failed to load statistics</div>

  const renderClientDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Projects"
          value={stats.stats.total_projects}
          icon="📊"
          color="blue"
        />
        <StatCard
          title="Active Projects"
          value={stats.stats.active_projects}
          icon="🚀"
          color="green"
        />
        <StatCard
          title="Completed"
          value={stats.stats.completed_projects}
          icon="✅"
          color="emerald"
        />
        <StatCard
          title="Total Spent"
          value={`$${stats.stats.total_spent}`}
          icon="💰"
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Active Proposals"
          value={stats.stats.active_proposals}
          icon="📝"
          color="orange"
        />
        <StatCard
          title="Avg Project Budget"
          value={`$${stats.stats.avg_project_budget.toFixed(2)}`}
          icon="💵"
          color="indigo"
        />
        <StatCard
          title="Projects This Month"
          value={stats.stats.projects_this_month}
          icon="📅"
          color="cyan"
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-4">
          <Link to="/create-project" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg text-center transition">
            📌 Post Project
          </Link>
          <Link to="/projects" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg text-center transition">
            👀 View Projects
          </Link>
        </div>
      </div>
    </div>
  )

  const renderFreelancerDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Proposals"
          value={stats.stats.total_proposals}
          icon="📝"
          color="blue"
        />
        <StatCard
          title="Accepted"
          value={stats.stats.accepted_proposals}
          icon="✅"
          color="green"
        />
        <StatCard
          title="Total Earned"
          value={`$${stats.stats.total_earned}`}
          icon="💰"
          color="emerald"
        />
        <StatCard
          title="Success Rate"
          value={`${stats.stats.success_rate}%`}
          icon="📈"
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Pending"
          value={stats.stats.pending_proposals}
          icon="⏳"
          color="orange"
        />
        <StatCard
          title="Avg Bid"
          value={`$${stats.stats.avg_bid_amount.toFixed(2)}`}
          icon="💵"
          color="indigo"
        />
        <StatCard
          title="This Month"
          value={stats.stats.proposals_this_month}
          icon="📅"
          color="cyan"
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-4">
          <Link to="/projects" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg text-center transition">
            🔍 Find Projects
          </Link>
          <Link to="/earnings" className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg text-center transition">
            💵 View Earnings
          </Link>
        </div>
      </div>
    </div>
  )

  const renderConsultantDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Sessions"
          value={stats.stats.total_sessions}
          icon="📞"
          color="blue"
        />
        <StatCard
          title="Completed"
          value={stats.stats.completed_sessions}
          icon="✅"
          color="green"
        />
        <StatCard
          title="Total Earned"
          value={`$${stats.stats.total_earned}`}
          icon="💰"
          color="emerald"
        />
        <StatCard
          title="Avg Session Cost"
          value={`$${stats.stats.avg_session_cost.toFixed(2)}`}
          icon="💵"
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Pending"
          value={stats.stats.pending_sessions}
          icon="⏳"
          color="orange"
        />
        <StatCard
          title="Confirmed"
          value={stats.stats.confirmed_sessions}
          icon="🔔"
          color="indigo"
        />
        <StatCard
          title="Total Clients"
          value={stats.stats.total_clients}
          icon="👥"
          color="cyan"
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-4">
          <Link to="/manage-availability" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg text-center transition">
            ⏰ Manage Hours
          </Link>
          <Link to="/earnings" className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg text-center transition">
            💵 View Earnings
          </Link>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-indigo-600">SkillBridge Analytics</h1>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 capitalize">
            {user?.role} Dashboard
          </h2>
        </div>

        {user?.role === 'client' && renderClientDashboard()}
        {user?.role === 'freelancer' && renderFreelancerDashboard()}
        {user?.role === 'consultant' && renderConsultantDashboard()}
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    green: 'bg-green-50 border-green-200 text-green-900',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    purple: 'bg-purple-50 border-purple-200 text-purple-900',
    orange: 'bg-orange-50 border-orange-200 text-orange-900',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-900',
    cyan: 'bg-cyan-50 border-cyan-200 text-cyan-900',
  }

  return (
    <div className={`${colorClasses[color]} border rounded-lg p-6`}>
      <p className="text-4xl mb-2">{icon}</p>
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  )
}
