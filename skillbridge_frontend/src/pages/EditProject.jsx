import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'

function EditProject() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()

  console.log('EditProject mounted with id:', id, 'user:', user)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    budget_type: 'fixed',
    category: '',
    skills_required: '',
    duration: 'less_than_month',
    deadline: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [project, setProject] = useState(null)

  useEffect(() => {
    fetchProject()
  }, [id])

  const fetchProject = async () => {
    try {
      console.log('Fetching project with id:', id)
      const response = await api.get(`/projects/${id}/`)
      console.log('Project data received:', response.data)
      const data = response.data
      setProject(data)
      setFormData({
        title: data.title || '',
        description: data.description || '',
        budget: data.budget || '',
        budget_type: data.budget_type || 'fixed',
        category: data.category || '',
        skills_required: data.skills_required || '',
        duration: data.duration || 'less_than_month',
        deadline: data.deadline ? data.deadline.slice(0, 16) : '',
      })
    } catch (error) {
      console.error('Failed to fetch project:', error)
      setErrors({ general: 'Project not found' })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErrors({})

    try {
      await api.patch(`/projects/${id}/`, formData)
      navigate(`/projects/${id}`)
    } catch (error) {
      if (error.response?.data) {
        setErrors(error.response.data)
      } else {
        setErrors({ general: 'Failed to update project' })
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  if (!project) {
    console.error('Project is null')
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{errors.general || 'Project not found'}</p>
          <Link to="/projects" className="text-indigo-600 hover:text-indigo-700">Back to Projects</Link>
        </div>
      </div>
    )
  }

  const isOwnerOrAdmin = project.client && (project.client.id === user?.id || user?.role === 'admin')

  if (!isOwnerOrAdmin) {
    console.error('Access denied: User is not owner or admin')
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">You can only edit your own projects</p>
          <Link to="/projects" className="text-indigo-600 hover:text-indigo-700">Back to Projects</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to={`/projects/${id}`} className="text-indigo-600 hover:text-indigo-700 font-bold">← Back to Project</Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Project</h1>
          <p className="text-gray-600 mb-6">Update your project details</p>

          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., Build a React Dashboard"
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <p className="text-xs text-gray-500 mb-2">
                💡 Tip: Supports emoji, line breaks, and markdown:
                **bold**, *italic*, `code`, - bullet, 1. numbered
              </p>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="10"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 whitespace-pre-wrap font-mono text-sm"
                placeholder={`Describe your project in detail...\n\nYou can use:\n- Line breaks for formatting\n- **bold text**\n- *italic text*\n- \`code\`\n- Bullet points\n- 😊 Emoji are supported!`}
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget *</label>
                <input
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  required
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="0.00"
                />
                {errors.budget && <p className="text-red-500 text-sm mt-1">{errors.budget}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget Type *</label>
                <select
                  name="budget_type"
                  value={formData.budget_type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="fixed">Fixed Price</option>
                  <option value="hourly">Hourly</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Web Development"
                />
                {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration *</label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="less_than_month">Less than a month</option>
                  <option value="1_3_months">1 to 3 months</option>
                  <option value="3_6_months">3 to 6 months</option>
                  <option value="more_than_6_months">More than 6 months</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Required Skills</label>
              <input
                type="text"
                name="skills_required"
                value={formData.skills_required}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Separate skills with commas (e.g., React, Node.js, MongoDB)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
              <input
                type="datetime-local"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => navigate(`/projects/${id}`)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-4 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EditProject
