import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'

export default function JobDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showApplicationForm, setShowApplicationForm] = useState(false)
  const [applicationData, setApplicationData] = useState({
    cover_letter: '',
    resume: null,
  })

  useEffect(() => {
    fetchJob()
  }, [id])

  const fetchJob = async () => {
    try {
      const response = await api.get(`/jobs/${id}/`)
      setJob(response.data)
    } catch (error) {
      console.error('Failed to fetch job:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, files } = e.target
    if (name === 'resume') {
      setApplicationData(prev => ({ ...prev, resume: files[0] }))
    } else {
      setApplicationData(prev => ({ ...prev, [name]: value }))
    }
  }

  const submitApplication = async (e) => {
    e.preventDefault()
    try {
      const formData = new FormData()
      formData.append('job', job.id)
      formData.append('cover_letter', applicationData.cover_letter)
      if (applicationData.resume) {
        formData.append('resume', applicationData.resume)
      }

      await api.post('/jobs/applications/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      alert('Application submitted successfully!')
      setShowApplicationForm(false)
      setApplicationData({ cover_letter: '', resume: null })
      fetchJob()
    } catch (error) {
      console.error('Failed to submit application:', error)
      alert('Failed to submit application')
    }
  }

  const acceptApplication = async (applicationId) => {
    try {
      await api.post(`/jobs/${job.id}/accept_application/`, { application_id: applicationId })
      alert('Application accepted!')
      fetchJob()
    } catch (error) {
      console.error('Failed to accept application:', error)
      alert('Failed to accept application')
    }
  }

  const updateApplicationStatus = async (applicationId, newStatus) => {
    try {
      await api.post(`/jobs/${job.id}/update_application_status/`, {
        application_id: applicationId,
        status: newStatus
      })
      alert('Application status updated!')
      fetchJob()
    } catch (error) {
      console.error('Failed to update application status:', error)
      alert('Failed to update application status')
    }
  }

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>
  if (!job) return <div className="flex justify-center items-center h-screen">Job not found</div>

  const hasApplied = job.applications?.some(a => a.applicant.id === user?.id)
  const isJobPoster = job.posted_by.id === user?.id

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/jobs" className="text-indigo-600 hover:text-indigo-700 font-bold">← Jobs</Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
              <p className="text-gray-600">{job.company} • {job.location}</p>
            </div>
            <span className={`px-4 py-2 rounded-full font-semibold ${
              job.status === 'open' ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {job.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-gray-600 text-sm">Salary Range</p>
              <p className="text-lg font-bold text-gray-900">
                {job.salary_min && job.salary_max ? `$${job.salary_min} - $${job.salary_max}` : 'Competitive'}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Job Type</p>
              <p className="font-semibold text-gray-900 capitalize">{job.job_type}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Experience Level</p>
              <p className="font-semibold text-gray-900 capitalize">{job.experience_level}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Category</p>
              <p className="font-semibold text-gray-900">{job.category}</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Job Description</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
          </div>

          {job.skills_required && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {job.skills_required.split(',').map((skill, i) => (
                  <span key={i} className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                    {skill.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {!isJobPoster && job.status === 'open' && (
            <div className="mb-6">
              {!showApplicationForm && !hasApplied && (
                <button
                  onClick={() => setShowApplicationForm(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold"
                >
                  Apply for this Job
                </button>
              )}
              {hasApplied && (
                <p className="text-green-600 font-semibold">You have already applied for this job</p>
              )}
            </div>
          )}

          {showApplicationForm && (
            <form onSubmit={submitApplication} className="bg-gray-50 p-6 rounded-lg mb-6 space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Submit Your Application</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resume (PDF/DOC) *</label>
                <input
                  type="file"
                  name="resume"
                  onChange={handleChange}
                  accept=".pdf,.doc,.docx"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cover Letter</label>
                <textarea
                  name="cover_letter"
                  value={applicationData.cover_letter}
                  onChange={handleChange}
                  rows="6"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Tell the employer why you're a great fit for this job..."
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold"
                >
                  Submit Application
                </button>
                <button
                  type="button"
                  onClick={() => setShowApplicationForm(false)}
                  className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {isJobPoster && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Applications ({job.applications.length})</h3>
            {job.applications.length === 0 ? (
              <p className="text-gray-600">No applications yet</p>
            ) : (
              <div className="space-y-4">
                {job.applications.map(app => (
                  <div key={app.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-gray-900">{app.applicant.username}</p>
                        <p className="text-gray-600 text-sm">{app.applicant.email}</p>
                      </div>
                      <span className={`px-3 py-1 rounded text-sm font-semibold ${
                        app.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        app.status === 'shortlisted' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {app.status}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-4">{app.cover_letter}</p>
                    {app.resume && (
                      <a href={app.resume} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700 text-sm font-semibold mb-4 inline-block">
                        View Resume
                      </a>
                    )}
                    {app.status === 'applied' && job.status === 'open' && (
                      <div className="space-x-2">
                        <button
                          onClick={() => updateApplicationStatus(app.id, 'shortlisted')}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-semibold"
                        >
                          Shortlist
                        </button>
                        <button
                          onClick={() => updateApplicationStatus(app.id, 'rejected')}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-semibold"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => acceptApplication(app.id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-semibold"
                        >
                          Accept
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
