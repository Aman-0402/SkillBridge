import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'

export default function AdminPanel() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('users')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (user?.role === 'admin' && user?.is_staff) {
      fetchData(activeTab)
    }
  }, [activeTab])

  const fetchData = async (tab) => {
    setLoading(true)
    try {
      const endpoints = {
        users: '/chat/admin/users/',
        projects: '/chat/admin/projects/',
        proposals: '/chat/admin/proposals/',
        payments: '/chat/admin/payments/',
        jobs: '/chat/admin/jobs/',
        consultations: '/chat/admin/consultations/'
      }

      const response = await api.get(endpoints[tab], {
        params: searchTerm ? { search: searchTerm } : {}
      })
      setData(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error(`Failed to fetch ${tab}:`, error)
      setData([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (tab, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${tab.slice(0, -1)}?`)) {
      return
    }

    try {
      const deleteEndpoints = {
        users: `/chat/admin/delete_user/?user_id=${id}`,
        projects: `/chat/admin/delete_project/?project_id=${id}`,
        proposals: `/chat/admin/delete_proposal/?proposal_id=${id}`,
        payments: `/chat/admin/delete_payment/?payment_id=${id}`,
        jobs: `/chat/admin/delete_project/?project_id=${id}`,
        consultations: `/chat/admin/delete_consultation/?consultation_id=${id}`
      }

      await api.delete(deleteEndpoints[tab])
      fetchData(tab)
    } catch (error) {
      console.error('Failed to delete:', error)
      alert('Failed to delete. Please try again.')
    }
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
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

  const tabs = [
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'projects', label: 'Projects', icon: '📊' },
    { id: 'proposals', label: 'Proposals', icon: '📝' },
    { id: 'payments', label: 'Payments', icon: '💰' },
    { id: 'jobs', label: 'Jobs', icon: '💼' },
    { id: 'consultations', label: 'Consultations', icon: '📞' }
  ]

  const renderTable = () => {
    if (loading) return <div className="text-center py-8">Loading...</div>
    if (!data.length) return <div className="text-center py-8 text-gray-600">No data found</div>

    const columns = {
      users: ['username', 'email', 'role', 'is_staff', 'date_joined'],
      projects: ['title', 'client', 'budget', 'status', 'created_at'],
      proposals: ['project', 'freelancer', 'bid_amount', 'status', 'created_at'],
      payments: ['project', 'freelancer', 'amount', 'status', 'created_at'],
      jobs: ['title', 'client', 'budget', 'status', 'created_at'],
      consultations: ['consultant', 'client', 'session_cost', 'status', 'created_at']
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-200">
            <tr>
              {columns[activeTab]?.map(col => (
                <th key={col} className="px-4 py-2 text-left">{col}</th>
              ))}
              <th className="px-4 py-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr key={idx} className="border-b hover:bg-gray-50">
                {columns[activeTab]?.map(col => (
                  <td key={col} className="px-4 py-2">
                    {typeof item[col] === 'object' ? JSON.stringify(item[col]) : String(item[col] || '-')}
                  </td>
                ))}
                <td className="px-4 py-2">
                  <button
                    onClick={() => handleDelete(activeTab, item.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-red-600">Admin Control Panel</h1>
          <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">Back to Dashboard</Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        {activeTab === 'users' && (
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 capitalize">{activeTab}</h2>
          {renderTable()}
        </div>
      </div>
    </div>
  )
}
