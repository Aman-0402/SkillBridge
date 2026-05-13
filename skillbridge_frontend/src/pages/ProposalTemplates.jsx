import { useState, useEffect } from 'react'
import { FaPlus, FaTrash, FaPen, FaXmark, FaFileLines } from 'react-icons/fa6'
import api from '../services/api'
import Swal from 'sweetalert2'

function TemplateForm({ initial, onSave, onCancel }) {
  const [title, setTitle] = useState(initial?.title || '')
  const [content, setContent] = useState(initial?.content || '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    setSaving(true)
    try {
      if (initial?.id) {
        const res = await api.put(`/projects/proposal-templates/${initial.id}/`, { title, content })
        onSave(res.data, 'edit')
      } else {
        const res = await api.post('/projects/proposal-templates/', { title, content })
        onSave(res.data, 'create')
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'Failed', text: 'Could not save template.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-5 space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">Template Name</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g., Web Development Proposal"
          required
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">Cover Letter Content</label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={8}
          required
          placeholder="Write your reusable cover letter here. Be specific about your skills and approach..."
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
        />
        <p className="mt-1 text-xs text-slate-400">{content.length} characters</p>
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-black text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {saving ? 'Saving…' : initial?.id ? 'Update Template' : 'Save Template'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-black text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export default function ProposalTemplates() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState(null)

  const fetchTemplates = () => {
    setLoading(true)
    api.get('/projects/proposal-templates/')
      .then(res => setTemplates(Array.isArray(res.data) ? res.data : res.data.results || []))
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchTemplates() }, [])

  const handleSave = (saved, mode) => {
    if (mode === 'create') {
      setTemplates(prev => [saved, ...prev])
    } else {
      setTemplates(prev => prev.map(t => t.id === saved.id ? saved : t))
    }
    setShowForm(false)
    setEditTarget(null)
    Swal.fire({ icon: 'success', title: 'Saved!', timer: 1200, showConfirmButton: false })
  }

  const handleDelete = async (id, title) => {
    const res = await Swal.fire({
      title: `Delete "${title}"?`,
      text: 'This cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Delete',
    })
    if (!res.isConfirmed) return
    try {
      await api.delete(`/projects/proposal-templates/${id}/`)
      setTemplates(prev => prev.filter(t => t.id !== id))
      Swal.fire({ icon: 'success', title: 'Deleted', timer: 1000, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'Failed', text: 'Could not delete template.' })
    }
  }

  const startEdit = (t) => {
    setEditTarget(t)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">Freelance Tools</p>
          <h1 className="mt-1 text-2xl font-black text-slate-950">Proposal Templates</h1>
          <p className="mt-1 text-sm text-slate-500">Save reusable cover letters. Apply them in one click when bidding on projects.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => { setEditTarget(null); setShowForm(true) }}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-black text-white hover:bg-indigo-500"
          >
            <FaPlus /> New Template
          </button>
        )}
      </div>

      {showForm && (
        <TemplateForm
          initial={editTarget}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditTarget(null) }}
        />
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <FaFileLines className="text-4xl text-slate-300" />
          <div>
            <p className="font-black text-slate-700">No templates yet</p>
            <p className="mt-1 text-sm text-slate-400">Create your first template to reuse across proposals.</p>
          </div>
          <button
            onClick={() => { setEditTarget(null); setShowForm(true) }}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-black text-white hover:bg-indigo-500"
          >
            Create Template
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map(t => (
            <div key={t.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-black text-slate-950">{t.title}</p>
                  <p className="mt-1.5 text-sm text-slate-500 leading-relaxed line-clamp-3">{t.content}</p>
                  <p className="mt-2 text-xs text-slate-400">
                    {t.content.length} chars · Updated {new Date(t.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => startEdit(t)}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600"
                  >
                    <FaPen className="text-[10px]" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(t.id, t.title)}
                    className="flex items-center gap-1.5 rounded-xl border border-rose-100 px-3 py-2 text-xs font-black text-rose-500 transition hover:bg-rose-50"
                  >
                    <FaTrash className="text-[10px]" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
