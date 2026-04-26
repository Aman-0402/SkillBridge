import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'

export default function Consultants() {
  const { user } = useAuth()
  const [consultants, setConsultants] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchConsultants()
  }, [filter])

  const fetchConsultants = async () => {
    try {
      const url = filter === 'my_sessions' ? '/consultations/sessions/my_sessions/' : '/consultations/sessions/available_consultants/'
      const response = await api.get(url)
      setConsultants(Array.isArray(response.data) ? response.data : response.data.results || [])
    } catch (error) {
      console.error('Failed to fetch consultants:', error)
      setConsultants([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">SkillBridge</h1>
          <div className="space-x-4">
            <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</Link>
            <Link to="/profile" className="text-gray-600 hover:text-gray-900">Profile</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Consultants</h2>
        </div>

        <div className="mb-6 space-x-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`}
          >
            Available Consultants
          </button>
          <button
            onClick={() => setFilter('my_sessions')}
            className={`px-4 py-2 rounded ${filter === 'my_sessions' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`}
          >
            My Sessions
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : consultants.length === 0 ? (
          <div className="text-center py-8 text-gray-600">No consultants found</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {consultants.map(consultant => (
              <Link key={consultant.id} to={`/consultants/${consultant.username}`}>
                <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{consultant.username}</h3>
                  <p className="text-gray-600 mb-2">{consultant.first_name} {consultant.last_name}</p>
                  <p className="text-gray-700 text-sm mb-4">{consultant.bio || 'No bio added'}</p>
                  <div className="flex justify-between items-center">
                    <div>
                      {consultant.hourly_rate && (
                        <p className="text-indigo-600 font-semibold">${consultant.hourly_rate}/hr</p>
                      )}
                    </div>
                    <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm font-semibold">
                      Book Session
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
