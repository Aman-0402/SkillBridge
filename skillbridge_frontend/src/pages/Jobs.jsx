import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'

export default function Jobs() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchJobs()
  }, [filter])

  const fetchJobs = async () => {
    try {
      const url = filter === 'my_jobs' ? '/jobs/my_jobs/' : '/jobs/'
      const response = await api.get(url)
      setJobs(Array.isArray(response.data) ? response.data : response.data.results || [])
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
      setJobs([])
    } finally {
      setLoading(false)
    }
  }

  const formatSalary = (min, max) => {
    if (!min && !max) return 'Competitive'
    if (min && max) return `$${min} - $${max}`
    if (min) return `From $${min}`
    return `Up to $${max}`
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
          <h2 className="text-3xl font-bold text-gray-900">Jobs</h2>
          {user?.role === 'client' && (
            <Link to="/post-job" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-semibold">
              Post a Job
            </Link>
          )}
        </div>

        <div className="mb-6 space-x-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`}
          >
            All Jobs
          </button>
          {user?.role === 'client' && (
            <button
              onClick={() => setFilter('my_jobs')}
              className={`px-4 py-2 rounded ${filter === 'my_jobs' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`}
            >
              My Jobs
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-8 text-gray-600">No jobs found</div>
        ) : (
          <div className="space-y-4">
            {jobs.map(job => (
              <Link key={job.id} to={`/jobs/${job.id}`}>
                <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{job.title}</h3>
                  <p className="text-gray-600 mb-4">{job.company} • {job.location}</p>
                  <p className="text-gray-600 mb-4 line-clamp-2">{job.description}</p>
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600">Salary: <span className="font-semibold text-gray-900">{formatSalary(job.salary_min, job.salary_max)}</span></p>
                      <div className="flex space-x-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">{job.job_type}</span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">{job.experience_level}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        job.status === 'open' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {job.status}
                      </span>
                      <p className="text-sm text-gray-600 mt-2">{job.application_count} applications</p>
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
