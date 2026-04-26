import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import api from '../services/api'

export default function Profile() {
  const { user, logout } = useAuth()
  const [profile, setProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/profile/')
      console.log('Profile loaded:', response.data)
      setProfile(response.data)
      setFormData(response.data)
    } catch (error) {
      console.error('Failed to fetch profile:', error.response || error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await api.put('/auth/profile/', formData)
      setProfile(response.data)
      setEditing(false)
    } catch (error) {
      console.error('Failed to update profile:', error)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  if (!profile) {
    return <div className="flex justify-center items-center h-screen text-red-600">Error loading profile</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">SkillBridge</h1>
          <a href="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</a>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
            <button
              onClick={() => setEditing(!editing)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
            >
              {editing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name || ''}
                    onChange={handleChange}
                    className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name || ''}
                    onChange={handleChange}
                    className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio || ''}
                  onChange={handleChange}
                  rows="4"
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location || ''}
                    onChange={handleChange}
                    className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Hourly Rate</label>
                  <input
                    type="number"
                    name="hourly_rate"
                    value={formData.hourly_rate || ''}
                    onChange={handleChange}
                    step="0.01"
                    className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Portfolio URL</label>
                <input
                  type="url"
                  name="portfolio_url"
                  value={formData.portfolio_url || ''}
                  onChange={handleChange}
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-semibold"
              >
                Save Changes
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-gray-600 text-sm">Username</p>
                <p className="text-gray-900 font-semibold">{profile?.username}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 text-sm">First Name</p>
                  <p className="text-gray-900 font-semibold">{profile?.first_name || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Last Name</p>
                  <p className="text-gray-900 font-semibold">{profile?.last_name || 'Not set'}</p>
                </div>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Role</p>
                <p className="text-gray-900 font-semibold capitalize">{profile?.role}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Bio</p>
                <p className="text-gray-900">{profile?.bio || 'No bio added'}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Location</p>
                <p className="text-gray-900">{profile?.location || 'Not set'}</p>
              </div>
              {profile?.hourly_rate && (
                <div>
                  <p className="text-gray-600 text-sm">Hourly Rate</p>
                  <p className="text-gray-900 font-semibold">${profile.hourly_rate}/hr</p>
                </div>
              )}
            </div>
          )}
        </div>

        <SkillsSection userId={user?.id} />
        <ExperienceSection userId={user?.id} />
      </div>
    </div>
  )
}

function SkillsSection({ userId }) {
  const [skills, setSkills] = useState([])
  const [newSkill, setNewSkill] = useState({ name: '', proficiency: 'intermediate' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSkills()
  }, [])

  const fetchSkills = async () => {
    try {
      const response = await api.get('/auth/skills/')
      console.log('Skills response:', response.data)
      const skillsArray = Array.isArray(response.data) ? response.data : response.data.results || []
      setSkills(skillsArray)
    } catch (error) {
      console.error('Failed to fetch skills:', error)
      setSkills([])
    } finally {
      setLoading(false)
    }
  }

  const addSkill = async (e) => {
    e.preventDefault()
    try {
      const response = await api.post('/auth/skills/', newSkill)
      setSkills([...skills, response.data])
      setNewSkill({ name: '', proficiency: 'intermediate' })
    } catch (error) {
      console.error('Failed to add skill:', error)
    }
  }

  const deleteSkill = async (skillId) => {
    try {
      await api.delete(`/auth/skills/${skillId}/`)
      setSkills(skills.filter(s => s.id !== skillId))
    } catch (error) {
      console.error('Failed to delete skill:', error)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Skills</h3>

      <form onSubmit={addSkill} className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Add a skill"
            value={newSkill.name}
            onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          />
          <select
            value={newSkill.proficiency}
            onChange={(e) => setNewSkill({ ...newSkill, proficiency: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="expert">Expert</option>
          </select>
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
          >
            Add Skill
          </button>
        </div>
      </form>

      <div className="space-y-2">
        {skills.map(skill => (
          <div key={skill.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-semibold text-gray-900">{skill.name}</p>
              <p className="text-sm text-gray-600 capitalize">{skill.proficiency}</p>
            </div>
            <button
              onClick={() => deleteSkill(skill.id)}
              className="text-red-600 hover:text-red-700 text-sm"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function ExperienceSection({ userId }) {
  const [experiences, setExperiences] = useState([])
  const [newExp, setNewExp] = useState({
    title: '',
    company: '',
    description: '',
    start_date: '',
    end_date: '',
    is_current: false,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchExperiences()
  }, [])

  const fetchExperiences = async () => {
    try {
      const response = await api.get('/auth/experiences/')
      console.log('Experiences response:', response.data)
      const expsArray = Array.isArray(response.data) ? response.data : response.data.results || []
      setExperiences(expsArray)
    } catch (error) {
      console.error('Failed to fetch experiences:', error)
      setExperiences([])
    } finally {
      setLoading(false)
    }
  }

  const addExperience = async (e) => {
    e.preventDefault()
    try {
      const response = await api.post('/auth/experiences/', newExp)
      setExperiences([response.data, ...experiences])
      setNewExp({ title: '', company: '', description: '', start_date: '', end_date: '', is_current: false })
    } catch (error) {
      console.error('Failed to add experience:', error)
    }
  }

  const deleteExperience = async (expId) => {
    try {
      await api.delete(`/auth/experiences/${expId}/`)
      setExperiences(experiences.filter(e => e.id !== expId))
    } catch (error) {
      console.error('Failed to delete experience:', error)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Experience</h3>

      <form onSubmit={addExperience} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Job Title"
            value={newExp.title}
            onChange={(e) => setNewExp({ ...newExp, title: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg"
            required
          />
          <input
            type="text"
            placeholder="Company"
            value={newExp.company}
            onChange={(e) => setNewExp({ ...newExp, company: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg"
            required
          />
        </div>
        <textarea
          placeholder="Description"
          value={newExp.description}
          onChange={(e) => setNewExp({ ...newExp, description: e.target.value })}
          rows="3"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        />
        <div className="grid grid-cols-2 gap-4">
          <input
            type="date"
            value={newExp.start_date}
            onChange={(e) => setNewExp({ ...newExp, start_date: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg"
            required
          />
          <input
            type="date"
            value={newExp.end_date}
            onChange={(e) => setNewExp({ ...newExp, end_date: e.target.value })}
            disabled={newExp.is_current}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
          />
        </div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={newExp.is_current}
            onChange={(e) => setNewExp({ ...newExp, is_current: e.target.checked })}
            className="mr-2"
          />
          <span className="text-gray-700">Currently working here</span>
        </label>
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-semibold"
        >
          Add Experience
        </button>
      </form>

      <div className="space-y-4">
        {experiences.map(exp => (
          <div key={exp.id} className="p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-semibold text-gray-900">{exp.title}</p>
                <p className="text-sm text-gray-600">{exp.company}</p>
              </div>
              <button
                onClick={() => deleteExperience(exp.id)}
                className="text-red-600 hover:text-red-700 text-sm"
              >
                Delete
              </button>
            </div>
            <p className="text-sm text-gray-600">{exp.start_date} - {exp.end_date || 'Present'}</p>
            {exp.description && <p className="text-sm text-gray-700 mt-2">{exp.description}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
