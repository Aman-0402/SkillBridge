import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">SkillBridge</h1>
          <div className="space-x-4">
            <a href="/profile" className="text-gray-600 hover:text-gray-900">Profile</a>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Welcome, {user?.username}!</h2>
          <p className="text-gray-600 mb-4">Email: {user?.email}</p>
          <p className="text-gray-600 mb-4">Role: <span className="capitalize font-semibold">{user?.role}</span></p>

          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a href="/profile" className="p-4 bg-indigo-50 rounded-lg border border-indigo-200 hover:shadow-lg transition">
                <h4 className="font-semibold text-indigo-900">Profile</h4>
                <p className="text-sm text-gray-600">View and edit your profile</p>
              </a>
              <a href="/projects" className="p-4 bg-green-50 rounded-lg border border-green-200 hover:shadow-lg transition">
                <h4 className="font-semibold text-green-900">Projects</h4>
                <p className="text-sm text-gray-600">Browse available projects</p>
              </a>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-900">Messages</h4>
                <p className="text-sm text-gray-600">Coming soon</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
