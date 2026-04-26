import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

export default function ManageAvailability() {
  const [availability, setAvailability] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [newSlot, setNewSlot] = useState({
    day_of_week: 'monday',
    start_time: '09:00',
    end_time: '10:00',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [availRes, sessRes] = await Promise.all([
        api.get('/consultations/availability/'),
        api.get('/consultations/sessions/my_sessions/')
      ])
      setAvailability(availRes.data || [])
      setSessions(Array.isArray(sessRes.data) ? sessRes.data : sessRes.data.results || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddSlot = async (e) => {
    e.preventDefault()
    try {
      const response = await api.post('/consultations/availability/', newSlot)
      setAvailability([...availability, response.data])
      setNewSlot({ day_of_week: 'monday', start_time: '09:00', end_time: '10:00' })
    } catch (error) {
      console.error('Failed to add slot:', error)
      alert('Failed to add availability slot')
    }
  }

  const deleteSlot = async (slotId) => {
    try {
      await api.delete(`/consultations/availability/${slotId}/`)
      setAvailability(availability.filter(a => a.id !== slotId))
    } catch (error) {
      console.error('Failed to delete slot:', error)
      alert('Failed to delete availability slot')
    }
  }

  const confirmSession = async (sessionId) => {
    try {
      await api.post(`/consultations/sessions/${sessionId}/confirm_session/`)
      fetchData()
      alert('Session confirmed!')
    } catch (error) {
      console.error('Failed to confirm session:', error)
      alert('Failed to confirm session')
    }
  }

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">SkillBridge</h1>
          <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Manage Availability</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add Availability Slot */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add Availability</h3>
            <form onSubmit={handleAddSlot} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
                <select
                  value={newSlot.day_of_week}
                  onChange={(e) => setNewSlot({...newSlot, day_of_week: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="monday">Monday</option>
                  <option value="tuesday">Tuesday</option>
                  <option value="wednesday">Wednesday</option>
                  <option value="thursday">Thursday</option>
                  <option value="friday">Friday</option>
                  <option value="saturday">Saturday</option>
                  <option value="sunday">Sunday</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={newSlot.start_time}
                    onChange={(e) => setNewSlot({...newSlot, start_time: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={newSlot.end_time}
                    onChange={(e) => setNewSlot({...newSlot, end_time: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg"
              >
                Add Time Slot
              </button>
            </form>
          </div>

          {/* Current Availability */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Current Availability</h3>
            {availability.length === 0 ? (
              <p className="text-gray-600">No availability slots added yet</p>
            ) : (
              <div className="space-y-2">
                {availability.map(slot => (
                  <div key={slot.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-900 capitalize">{slot.day_of_week}</p>
                      <p className="text-sm text-gray-600">{slot.start_time} - {slot.end_time}</p>
                    </div>
                    <button
                      onClick={() => deleteSlot(slot.id)}
                      className="text-red-600 hover:text-red-700 text-sm font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sessions */}
        <div className="bg-white rounded-lg shadow p-6 mt-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">My Sessions</h3>
          {sessions.length === 0 ? (
            <p className="text-gray-600">No sessions booked yet</p>
          ) : (
            <div className="space-y-4">
              {sessions.map(session => (
                <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-gray-900">{session.title}</p>
                      <p className="text-gray-600">{session.client.username} • {session.session_type}</p>
                    </div>
                    <span className={`px-3 py-1 rounded text-sm font-semibold ${
                      session.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      session.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {session.status}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm mb-2">{session.description}</p>
                  <p className="text-sm text-gray-600 mb-4">
                    {session.scheduled_date} • {session.start_time} - {session.end_time}
                  </p>
                  {session.status === 'pending' && (
                    <button
                      onClick={() => confirmSession(session.id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-semibold"
                    >
                      Confirm
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
