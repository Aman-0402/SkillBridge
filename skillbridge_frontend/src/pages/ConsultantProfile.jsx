import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'

export default function ConsultantProfile() {
  const { username } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [consultant, setConsultant] = useState(null)
  const [availability, setAvailability] = useState([])
  const [loading, setLoading] = useState(true)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [bookingData, setBookingData] = useState({
    session_type: 'call',
    title: '',
    description: '',
    scheduled_date: '',
    start_time: '',
    end_time: '',
    session_cost: '',
  })

  useEffect(() => {
    fetchConsultantProfile()
    fetchAvailability()
  }, [username])

  const fetchConsultantProfile = async () => {
    try {
      const response = await api.get(`/auth/profile/${username}/`)
      setConsultant(response.data)
    } catch (error) {
      console.error('Failed to fetch consultant profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailability = async () => {
    try {
      const response = await api.get(`/consultations/availability/consultant_availability/?consultant_id=${consultant?.id}`)
      setAvailability(response.data || [])
    } catch (error) {
      console.error('Failed to fetch availability:', error)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setBookingData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...bookingData,
        consultant: consultant.id,
      }
      await api.post('/consultations/sessions/', payload)
      alert('Session booked successfully!')
      setShowBookingForm(false)
      setBookingData({
        session_type: 'call',
        title: '',
        description: '',
        scheduled_date: '',
        start_time: '',
        end_time: '',
        session_cost: '',
      })
      navigate('/consultants')
    } catch (error) {
      console.error('Failed to book session:', error)
      alert('Failed to book session')
    }
  }

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>
  if (!consultant) return <div className="flex justify-center items-center h-screen">Consultant not found</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/consultants" className="text-indigo-600 hover:text-indigo-700 font-bold">← Back to Consultants</Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{consultant.username}</h1>
              <p className="text-gray-600">{consultant.first_name} {consultant.last_name}</p>
            </div>
            {user?.id !== consultant.id && (
              <button
                onClick={() => setShowBookingForm(!showBookingForm)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-semibold"
              >
                {showBookingForm ? 'Cancel' : 'Book a Session'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-gray-600 text-sm">Hourly Rate</p>
              <p className="text-2xl font-bold text-gray-900">${consultant.hourly_rate || 'Not set'}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Location</p>
              <p className="font-semibold text-gray-900">{consultant.location || 'Not specified'}</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Bio</h3>
            <p className="text-gray-700">{consultant.bio || 'No bio added'}</p>
          </div>

          {consultant.portfolio_url && (
            <div className="mb-6">
              <a href={consultant.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                View Portfolio →
              </a>
            </div>
          )}

          {consultant.skills && consultant.skills.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {consultant.skills.map((skill, i) => (
                  <span key={i} className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                    {skill.name} <span className="text-xs">({skill.proficiency})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {showBookingForm && (
            <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Book a Session</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Session Type *</label>
                  <select
                    name="session_type"
                    value={bookingData.session_type}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="call">Phone Call</option>
                    <option value="video">Video Call</option>
                    <option value="email">Email</option>
                    <option value="in_person">In Person</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Session Cost ($) *</label>
                  <input
                    type="number"
                    name="session_cost"
                    value={bookingData.session_cost}
                    onChange={handleChange}
                    step="0.01"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  name="title"
                  value={bookingData.title}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., Career Consultation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={bookingData.description}
                  onChange={handleChange}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="What do you want to discuss?"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    name="scheduled_date"
                    value={bookingData.scheduled_date}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                  <input
                    type="time"
                    name="start_time"
                    value={bookingData.start_time}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                  <input
                    type="time"
                    name="end_time"
                    value={bookingData.end_time}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg"
                >
                  Book Session
                </button>
                <button
                  type="button"
                  onClick={() => setShowBookingForm(false)}
                  className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {availability.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Available Time Slots</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {availability.map(slot => (
                <div key={slot.id} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="font-semibold text-gray-900 capitalize">{slot.day_of_week}</p>
                  <p className="text-sm text-gray-600">{slot.start_time} - {slot.end_time}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
