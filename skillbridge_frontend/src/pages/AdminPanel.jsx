import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Swal from 'sweetalert2'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'

/* ─── KYC Panel ─────────────────────────────────────────── */
function KYCPanel() {
  const [kycList, setKycList] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchKYC = () => {
    setLoading(true)
    api.get('/auth/kyc/pending/')
      .then(res => setKycList(Array.isArray(res.data) ? res.data : []))
      .catch(() => setKycList([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchKYC() }, [])

  const handleApprove = async (userId, username) => {
    const result = await Swal.fire({
      title: `Approve KYC for @${username}?`,
      text: 'This will mark the user as verified.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Approve',
    })
    if (!result.isConfirmed) return
    try {
      await api.post(`/auth/kyc/approve/${userId}/`)
      Swal.fire({ icon: 'success', title: 'Approved!', text: `@${username} is now verified.`, timer: 1800, showConfirmButton: false })
      fetchKYC()
    } catch {
      Swal.fire({ icon: 'error', title: 'Failed', text: 'Could not approve KYC.' })
    }
  }

  const handleReject = async (userId, username) => {
    const { value: reason, isConfirmed } = await Swal.fire({
      title: `Reject KYC for @${username}?`,
      input: 'textarea',
      inputLabel: 'Rejection reason (required)',
      inputPlaceholder: 'e.g. Document number unclear, unable to verify identity...',
      inputValidator: v => !v.trim() && 'Please provide a reason.',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Reject',
    })
    if (!isConfirmed || !reason) return
    try {
      await api.post(`/auth/kyc/reject/${userId}/`, { reason })
      Swal.fire({ icon: 'success', title: 'Rejected', timer: 1500, showConfirmButton: false })
      fetchKYC()
    } catch {
      Swal.fire({ icon: 'error', title: 'Failed', text: 'Could not reject KYC.' })
    }
  }

  if (loading) return <div className="py-8 text-center text-sm text-gray-500">Loading KYC requests…</div>
  if (!kycList.length) return (
    <div className="py-12 text-center text-sm text-gray-500">
      No pending KYC requests.
    </div>
  )

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-200">
          <tr>
            {['User', 'Role', 'Document Type', 'Document Number', 'Submitted At', 'Actions'].map(h => (
              <th key={h} className="px-4 py-2 text-left font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {kycList.map(item => (
            <tr key={item.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-2">
                <p className="font-semibold">{item.first_name} {item.last_name}</p>
                <p className="text-xs text-gray-500">@{item.username}</p>
              </td>
              <td className="px-4 py-2 capitalize">{item.role}</td>
              <td className="px-4 py-2 capitalize">{item.kyc_document_type?.replace('_', ' ')}</td>
              <td className="px-4 py-2 font-mono">{item.kyc_document_number}</td>
              <td className="px-4 py-2 text-xs text-gray-500">
                {item.kyc_submitted_at ? new Date(item.kyc_submitted_at).toLocaleDateString('en-IN') : '—'}
              </td>
              <td className="px-4 py-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(item.id, item.username)}
                    className="rounded bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-700"
                  >
                    Approve ✓
                  </button>
                  <button
                    onClick={() => handleReject(item.id, item.username)}
                    className="rounded bg-red-600 px-3 py-1 text-xs font-bold text-white hover:bg-red-700"
                  >
                    Reject ✗
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function AdminPanel() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('users')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

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
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `This ${tab.slice(0, -1)} will be permanently deleted.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete it',
    })
    if (!result.isConfirmed) return

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
      Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1500, showConfirmButton: false })
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Failed', text: 'Could not delete. Please try again.' })
    }
  }

  const handleToggleFeatured = async (userId, currentStatus) => {
    try {
      const res = await api.post(`/auth/toggle-featured/${userId}/`)
      setData(prev => prev.map(u => u.id === userId ? { ...u, is_featured: res.data.is_featured } : u))
      Swal.fire({
        icon: 'success',
        title: res.data.is_featured ? '⭐ Featured!' : 'Unfeatured',
        text: res.data.is_featured ? 'Consultant will appear in Featured section.' : 'Removed from Featured section.',
        timer: 1800,
        showConfirmButton: false,
      })
    } catch {
      Swal.fire({ icon: 'error', title: 'Failed', text: 'Could not update featured status.' })
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
    { id: 'consultations', label: 'Consultations', icon: '📞' },
    { id: 'kyc', label: 'KYC Requests', icon: '🪪' },
  ]

  const renderTable = () => {
    if (loading) return <div className="text-center py-8">Loading...</div>

    const columns = {
      users: ['username', 'email', 'role', 'is_featured', 'is_staff', 'date_joined'],
      projects: ['title', 'client', 'budget', 'status', 'created_at'],
      proposals: ['project', 'freelancer', 'bid_amount', 'status', 'created_at'],
      payments: ['project', 'freelancer', 'amount', 'status', 'created_at'],
      jobs: ['title', 'client', 'budget', 'status', 'created_at'],
      consultations: ['consultant', 'client', 'session_cost', 'status', 'created_at']
    }

    const displayData = activeTab === 'users' && roleFilter !== 'all'
      ? data.filter(u => u.role === roleFilter)
      : data

    if (!displayData.length) return <div className="text-center py-8 text-gray-600">No data found</div>

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
            {displayData.map((item, idx) => (
              <tr key={idx} className="border-b hover:bg-gray-50">
                {columns[activeTab]?.map(col => (
                  <td key={col} className="px-4 py-2">
                    {col === 'is_featured' ? (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${item.is_featured ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                        {item.is_featured ? '⭐ Featured' : 'No'}
                      </span>
                    ) : typeof item[col] === 'object' ? JSON.stringify(item[col]) : String(item[col] || '-')}
                  </td>
                ))}
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    {activeTab === 'users' && ['consultant', 'freelancer'].includes(item.role) && (
                      <button
                        onClick={() => handleToggleFeatured(item.id, item.is_featured)}
                        className={`px-3 py-1 rounded text-xs font-bold transition ${
                          item.is_featured
                            ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-700'
                        }`}
                      >
                        {item.is_featured ? '★ Unfeature' : '☆ Feature'}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(activeTab, item.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs"
                    >
                      Delete
                    </button>
                  </div>
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
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-gray-600 hover:text-gray-900 text-xl">← Back</Link>
            <h1 className="text-2xl font-bold text-red-600">Admin Control Panel</h1>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setRoleFilter('all') }}
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
          <div className="mb-4 space-y-3">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all',        label: '👥 All' },
                { value: 'client',     label: '👤 Clients' },
                { value: 'freelancer', label: '💼 Freelancers' },
                { value: 'consultant', label: '🎓 Consultants' },
                { value: 'admin',      label: '🛡 Admins' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setRoleFilter(value)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition ${
                    roleFilter === value
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 capitalize">{activeTab === 'kyc' ? 'Pending KYC Requests' : activeTab}</h2>
          {activeTab === 'kyc' ? <KYCPanel /> : renderTable()}
        </div>
      </div>
    </div>
  )
}
