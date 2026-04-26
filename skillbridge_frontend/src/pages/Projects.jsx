import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'

export default function Projects() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchProjects()
  }, [filter])

  const fetchProjects = async () => {
    try {
      const url = filter === 'my_projects' ? '/projects/my_projects/' : '/projects/'
      const response = await api.get(url)
      setProjects(Array.isArray(response.data) ? response.data : response.data.results || [])
    } catch (error) {
      console.error('Failed to fetch projects:', error)
      setProjects([])
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
          <h2 className="text-3xl font-bold text-gray-900">Projects</h2>
          {user?.role === 'client' && (
            <Link to="/create-project" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-semibold">
              Post a Project
            </Link>
          )}
        </div>

        <div className="mb-6 space-x-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`}
          >
            All Projects
          </button>
          {user?.role === 'client' && (
            <button
              onClick={() => setFilter('my_projects')}
              className={`px-4 py-2 rounded ${filter === 'my_projects' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`}
            >
              My Projects
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-8 text-gray-600">No projects found</div>
        ) : (
          <div className="space-y-4">
            {projects.map(project => (
              <Link key={project.id} to={`/projects/${project.id}`}>
                <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{project.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{project.description}</p>
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600">Budget: <span className="font-semibold text-gray-900">${project.budget}</span></p>
                      <p className="text-sm text-gray-600">Category: <span className="font-semibold">{project.category}</span></p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        project.status === 'open' ? 'bg-green-100 text-green-800' :
                        project.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {project.status}
                      </span>
                      <p className="text-sm text-gray-600 mt-2">{project.proposal_count} proposals</p>
                    </div>
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
