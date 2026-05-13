import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'

export default function ProjectDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showProposalForm, setShowProposalForm] = useState(false)
  const [proposalData, setProposalData] = useState({
    bid_amount: '',
    cover_letter: '',
    timeline: '',
  })
  const [templates, setTemplates] = useState([])
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)

  useEffect(() => {
    fetchProject()
  }, [id])

  useEffect(() => {
    if (showProposalForm && ['freelancer', 'consultant', 'both'].includes(user?.role)) {
      api.get('/projects/proposal-templates/').then(res => setTemplates(Array.isArray(res.data) ? res.data : res.data.results || [])).catch(() => {})
    }
  }, [showProposalForm, user?.role])

  const fetchProject = async () => {
    try {
      const response = await api.get(`/projects/${id}/`)
      setProject(response.data)
    } catch (error) {
      console.error('Failed to fetch project:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProposalChange = (e) => {
    const { name, value } = e.target
    setProposalData(prev => ({ ...prev, [name]: value }))
  }

  const submitProposal = async (e) => {
    e.preventDefault()
    try {
      await api.post('/projects/proposals/', {
        project: project.id,
        ...proposalData,
      })
      alert('Proposal submitted successfully!')
      setShowProposalForm(false)
      setProposalData({ bid_amount: '', cover_letter: '', timeline: '' })
      fetchProject()
    } catch (error) {
      console.error('Failed to submit proposal:', error)
      alert('Failed to submit proposal')
    }
  }

  const acceptProposal = async (proposalId) => {
    try {
      await api.post(`/projects/${project.id}/accept_proposal/`, { proposal_id: proposalId })
      alert('Proposal accepted!')
      fetchProject()
    } catch (error) {
      console.error('Failed to accept proposal:', error)
      alert('Failed to accept proposal')
    }
  }

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>
  if (!project) return <div className="flex justify-center items-center h-screen">Project not found</div>

  const hasProposal = project.proposals?.some(p => p.freelancer.id === user?.id)
  const isProjectOwner = project.client.id === user?.id

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/projects" className="text-indigo-600 hover:text-indigo-700 font-bold">← Projects</Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.title}</h1>
              <p className="text-gray-600">Posted by {project.client.username}</p>
            </div>
            <div className="flex items-center gap-3">
              {(isProjectOwner || user?.role === 'admin') && (
                <Link
                  to={`/projects/${id}/edit`}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition"
                >
                  ✏️ Edit
                </Link>
              )}
              <span className={`px-4 py-2 rounded-full font-semibold ${
                project.status === 'open' ? 'bg-green-100 text-green-800' :
                project.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {project.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-gray-600 text-sm">Budget</p>
              <p className="text-2xl font-bold text-gray-900">${project.budget}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Duration</p>
              <p className="font-semibold text-gray-900">{project.duration}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Category</p>
              <p className="font-semibold text-gray-900">{project.category}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Budget Type</p>
              <p className="font-semibold text-gray-900 capitalize">{project.budget_type}</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{project.description}</p>
          </div>

          {project.skills_required && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {project.skills_required.split(',').map((skill, i) => (
                  <span key={i} className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                    {skill.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {!isProjectOwner && project.status === 'open' && (
            <div className="mb-6">
              {!showProposalForm && !hasProposal && (
                <button
                  onClick={() => setShowProposalForm(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold"
                >
                  Submit Proposal
                </button>
              )}
              {hasProposal && (
                <p className="text-green-600 font-semibold">You have already submitted a proposal</p>
              )}
            </div>
          )}

          {showProposalForm && (
            <form onSubmit={submitProposal} className="bg-gray-50 p-6 rounded-lg mb-6 space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Submit Your Proposal</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bid Amount ($)</label>
                <input
                  type="number"
                  name="bid_amount"
                  value={proposalData.bid_amount}
                  onChange={handleProposalChange}
                  step="0.01"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timeline</label>
                <input
                  type="text"
                  name="timeline"
                  value={proposalData.timeline}
                  onChange={handleProposalChange}
                  placeholder="e.g., 2 weeks"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Cover Letter</label>
                  {templates.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowTemplatePicker(v => !v)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                    >
                      {showTemplatePicker ? '✕ Close' : '📋 Use Template'}
                    </button>
                  )}
                </div>

                {showTemplatePicker && (
                  <div className="mb-3 rounded-xl border border-indigo-100 bg-indigo-50 p-3 space-y-2">
                    <p className="text-xs font-black text-indigo-700 uppercase tracking-wide">Your Templates</p>
                    {templates.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setProposalData(prev => ({ ...prev, cover_letter: t.content }))
                          setShowTemplatePicker(false)
                        }}
                        className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2.5 text-left hover:border-indigo-400 hover:bg-indigo-50 transition"
                      >
                        <p className="text-sm font-black text-slate-900">{t.title}</p>
                        <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{t.content}</p>
                      </button>
                    ))}
                  </div>
                )}

                <textarea
                  name="cover_letter"
                  value={proposalData.cover_letter}
                  onChange={handleProposalChange}
                  rows="6"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Explain why you're a good fit for this project..."
                />
                <p className="mt-1 text-xs text-slate-400">
                  Manage templates in <Link to="/proposal-templates" className="font-bold text-indigo-600 hover:underline">Proposal Templates</Link>
                </p>
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold"
                >
                  Submit Proposal
                </button>
                <button
                  type="button"
                  onClick={() => setShowProposalForm(false)}
                  className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {isProjectOwner && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Proposals ({project.proposals.length})</h3>
            {project.proposals.length === 0 ? (
              <p className="text-gray-600">No proposals yet</p>
            ) : (
              <div className="space-y-4">
                {project.proposals.map(proposal => (
                  <div key={proposal.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-gray-900">{proposal.freelancer.username}</p>
                        <p className="text-gray-600 text-sm">${proposal.bid_amount} • {proposal.timeline}</p>
                      </div>
                      <span className={`px-3 py-1 rounded text-sm font-semibold ${
                        proposal.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        proposal.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {proposal.status}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-4">{proposal.cover_letter}</p>
                    {proposal.status === 'submitted' && project.status === 'open' && (
                      <button
                        onClick={() => acceptProposal(proposal.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-semibold"
                      >
                        Accept Proposal
                      </button>
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
