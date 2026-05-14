import { useState, useEffect } from 'react'
import {
  FaUser, FaEnvelope, FaPhone, FaLocationDot, FaBriefcase,
  FaShieldHalved, FaCircleCheck, FaClock, FaXmark, FaPen,
  FaKey, FaIdCard, FaEye, FaEyeSlash, FaTag, FaPlus,
  FaLinkedin, FaGithub, FaXTwitter, FaGlobe, FaLink,
  FaTrash, FaBoxOpen, FaLightbulb,
} from 'react-icons/fa6'
import Swal from 'sweetalert2'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'

/* ─── Profile Strength Meter ───────────────────────────────── */
function ProfileStrengthMeter({ pct }) {
  if (pct == null) return null
  const color = pct < 40 ? 'bg-rose-500' : pct < 70 ? 'bg-amber-400' : 'bg-emerald-500'
  const label = pct < 40 ? 'Getting started' : pct < 70 ? 'Looking good' : pct < 100 ? 'Almost complete' : 'Complete!'
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-black text-slate-950">Profile Strength</p>
        <span className={`text-xs font-black px-2 py-0.5 rounded-full ${pct >= 70 ? 'bg-emerald-100 text-emerald-700' : pct >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
          {pct}% — {label}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100">
        <div className={`h-2 rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      {pct < 100 && (
        <p className="mt-2 text-xs text-slate-400">
          {pct < 40 ? 'Add bio, location, skills, and hourly rate to boost visibility.' :
           pct < 70 ? 'Complete KYC verification and add expertise tags.' :
           'Add consultation packages and social links to reach 100%.'}
        </p>
      )}
    </div>
  )
}

/* ─── Packages Section ─────────────────────────────────────── */
const SESSION_TYPE_OPTS = [
  { value: 'call', label: 'Phone Call' },
  { value: 'video', label: 'Video Call' },
  { value: 'email', label: 'Email' },
  { value: 'in_person', label: 'In Person' },
]

function PackagesSection() {
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ name: '', session_type: 'video', duration_minutes: 60, price: '', description: '' })

  const fetchPkgs = () => {
    api.get('/consultations/packages/my_packages/')
      .then(res => setPackages(Array.isArray(res.data) ? res.data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchPkgs() }, [])

  const openAdd = () => {
    setEditId(null)
    setForm({ name: '', session_type: 'video', duration_minutes: 60, price: '', description: '' })
    setShowForm(true)
  }

  const openEdit = (pkg) => {
    setEditId(pkg.id)
    setForm({ name: pkg.name, session_type: pkg.session_type, duration_minutes: pkg.duration_minutes, price: pkg.price, description: pkg.description })
    setShowForm(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.price) return
    setSaving(true)
    try {
      if (editId) {
        const res = await api.patch(`/consultations/packages/${editId}/`, form)
        setPackages(prev => prev.map(p => p.id === editId ? res.data : p))
      } else {
        const res = await api.post('/consultations/packages/', form)
        setPackages(prev => [...prev, res.data])
      }
      setShowForm(false)
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Failed', text: err.response?.data?.detail || 'Could not save package.', timer: 2000, showConfirmButton: false })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    const r = await Swal.fire({ title: 'Delete package?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Delete' })
    if (!r.isConfirmed) return
    try {
      await api.delete(`/consultations/packages/${id}/`)
      setPackages(prev => prev.filter(p => p.id !== id))
    } catch {
      Swal.fire({ icon: 'error', title: 'Failed', timer: 1500, showConfirmButton: false })
    }
  }

  const toggleActive = async (pkg) => {
    try {
      const res = await api.patch(`/consultations/packages/${pkg.id}/`, { is_active: !pkg.is_active })
      setPackages(prev => prev.map(p => p.id === pkg.id ? res.data : p))
    } catch {}
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <FaBoxOpen className="text-indigo-500" />
        <p className="font-black text-slate-950">Consultation Packages</p>
        <span className="ml-auto text-xs text-slate-400">Define what you offer</span>
        <button onClick={openAdd} className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-black text-white hover:bg-indigo-500">
          <FaPlus className="text-[10px]" /> Add Package
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}</div>
      ) : packages.length === 0 && !showForm ? (
        <p className="text-sm text-slate-400">No packages yet. Add offerings like "Quick Call 30min — ₹999" to attract clients.</p>
      ) : (
        <div className="space-y-3">
          {packages.map(pkg => (
            <div key={pkg.id} className={`flex items-center gap-3 rounded-xl border p-3 transition ${pkg.is_active ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50 opacity-60'}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-black text-slate-900 text-sm">{pkg.name}</p>
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 capitalize">{pkg.session_type.replace('_', ' ')}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{pkg.duration_minutes}min</span>
                </div>
                {pkg.description && <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">{pkg.description}</p>}
              </div>
              <p className="shrink-0 font-black text-emerald-700 text-sm">₹{Number(pkg.price).toLocaleString('en-IN')}</p>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => toggleActive(pkg)} className={`rounded-lg px-2 py-1 text-[10px] font-black transition ${pkg.is_active ? 'bg-emerald-100 text-emerald-700 hover:bg-rose-100 hover:text-rose-700' : 'bg-slate-100 text-slate-500 hover:bg-emerald-100 hover:text-emerald-700'}`}>
                  {pkg.is_active ? 'Active' : 'Inactive'}
                </button>
                <button onClick={() => openEdit(pkg)} className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition"><FaPen className="text-xs" /></button>
                <button onClick={() => handleDelete(pkg.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"><FaTrash className="text-xs" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSave} className="mt-4 space-y-3 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-indigo-700">{editId ? 'Edit Package' : 'New Package'}</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-black text-slate-600">Package Name *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Strategy Session" required className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-black text-slate-600">Session Type *</label>
              <select value={form.session_type} onChange={e => setForm(p => ({ ...p, session_type: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100">
                {SESSION_TYPE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-black text-slate-600">Duration (minutes) *</label>
              <input type="number" min="15" max="480" value={form.duration_minutes} onChange={e => setForm(p => ({ ...p, duration_minutes: Number(e.target.value) }))} required className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-black text-slate-600">Price (₹) *</label>
              <input type="number" min="0" step="1" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} required placeholder="499" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-black text-slate-600">Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="What's included in this session?" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none" />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black text-white hover:bg-indigo-500 disabled:opacity-60">
              {saving ? 'Saving…' : 'Save Package'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-600 hover:bg-slate-50">Cancel</button>
          </div>
        </form>
      )}
    </div>
  )
}

/* ─── KYC status badge ──────────────────────────────────── */
const KYC_BADGE = {
  unverified: { label: 'Not Verified',  cls: 'bg-slate-100 text-slate-600',  icon: FaShieldHalved },
  pending:    { label: 'Under Review',  cls: 'bg-amber-50 text-amber-700',   icon: FaClock },
  verified:   { label: 'Verified',      cls: 'bg-blue-50 text-blue-700', icon: FaCircleCheck },
  rejected:   { label: 'Rejected',      cls: 'bg-rose-50 text-rose-600',     icon: FaXmark },
}

const DOC_TYPES = [
  { value: 'aadhaar',         label: 'Aadhaar Card' },
  { value: 'pan',             label: 'PAN Card' },
  { value: 'passport',        label: 'Passport' },
  { value: 'driving_license', label: 'Driving License' },
  { value: 'voter_id',        label: 'Voter ID' },
]

/* ─── Expertise Tags (consultants/freelancers only) ────── */
function ExpertiseTagsSection() {
  const [tags, setTags] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/auth/expertise-tags/')
      .then(res => setTags(Array.isArray(res.data) ? res.data : res.data.results || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const addTag = async () => {
    const tag = input.trim()
    if (!tag) return
    if (tags.some(t => t.tag.toLowerCase() === tag.toLowerCase())) {
      setInput(''); return
    }
    try {
      const res = await api.post('/auth/expertise-tags/', { tag })
      setTags(prev => [...prev, res.data])
      setInput('')
    } catch (err) {
      const msg = err.response?.data?.tag?.[0] || err.response?.data?.non_field_errors?.[0] || 'Failed to add tag.'
      Swal.fire({ icon: 'error', title: 'Error', text: msg, timer: 2000, showConfirmButton: false })
    }
  }

  const removeTag = async (id) => {
    try {
      await api.delete(`/auth/expertise-tags/${id}/`)
      setTags(prev => prev.filter(t => t.id !== id))
    } catch {
      Swal.fire({ icon: 'error', title: 'Failed to remove tag', timer: 1500, showConfirmButton: false })
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <FaTag className="text-blue-500" />
        <p className="font-black text-slate-950">Expertise Tags</p>
        <span className="ml-auto text-xs text-slate-400">Used for search & discovery</span>
      </div>

      {loading ? (
        <div className="flex flex-wrap gap-2">
          {[80, 100, 64, 90].map(w => (
            <div key={w} className="h-7 animate-pulse rounded-full bg-slate-100" style={{ width: w }} />
          ))}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {tags.map(t => (
              <span key={t.id} className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                {t.tag}
                <button type="button" onClick={() => removeTag(t.id)} className="text-blue-400 hover:text-rose-500 transition">
                  <FaXmark />
                </button>
              </span>
            ))}
            {tags.length === 0 && (
              <p className="text-sm text-slate-400">No expertise tags yet. Add keywords clients search for.</p>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="e.g. Financial Planning, GST, Startup Consulting"
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
            <button
              type="button"
              onClick={addTag}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white hover:bg-blue-500"
            >
              <FaPlus /> Add
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function KYCSection({ profile, onRefresh }) {
  const [showForm, setShowForm] = useState(false)
  const [docType, setDocType]   = useState('')
  const [docNum,  setDocNum]    = useState('')
  const [loading, setLoading]   = useState(false)

  const kyc = profile.kyc_status || 'unverified'
  const badge = KYC_BADGE[kyc]
  const Icon = badge.icon

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!docType || !docNum.trim()) {
      Swal.fire({ icon: 'warning', title: 'Missing fields', text: 'Please select document type and enter number.' })
      return
    }
    setLoading(true)
    try {
      await api.post('/auth/kyc/submit/', { kyc_document_type: docType, kyc_document_number: docNum.trim() })
      Swal.fire({ icon: 'success', title: 'Submitted!', text: 'Your KYC is under review. We\'ll update you soon.', timer: 2500, showConfirmButton: false })
      setShowForm(false)
      onRefresh()
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Failed', text: err.response?.data?.detail || 'Could not submit KYC.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
            <FaIdCard className="text-blue-600" />
          </div>
          <div>
            <p className="font-black text-slate-950">Identity Verification (KYC)</p>
            <p className="text-xs text-slate-500">Get a verified tick on your profile</p>
          </div>
        </div>
        <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ${badge.cls}`}>
          <Icon className="text-[11px]" /> {badge.label}
        </span>
      </div>

      {kyc === 'rejected' && profile.kyc_rejection_reason && (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <span className="font-black">Rejection reason: </span>{profile.kyc_rejection_reason}
        </div>
      )}

      {kyc === 'verified' && (
        <p className="mt-4 text-sm text-emerald-700">
          Your identity has been verified. A blue verified tick appears on your profile.
        </p>
      )}

      {kyc === 'pending' && (
        <p className="mt-4 text-sm text-amber-700">
          Your documents are being reviewed. This usually takes 1–2 business days.
        </p>
      )}

      {(kyc === 'unverified' || kyc === 'rejected') && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-blue-500"
        >
          <FaIdCard /> {kyc === 'rejected' ? 'Re-submit KYC' : 'Get Verified'}
        </button>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 border-t border-slate-100 pt-5">
          <div>
            <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">
              Document Type *
            </label>
            <select
              value={docType}
              onChange={e => setDocType(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              required
            >
              <option value="">Select document type</option>
              {DOC_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">
              Document Number *
            </label>
            <input
              type="text"
              value={docNum}
              onChange={e => setDocNum(e.target.value)}
              placeholder="e.g. XXXX XXXX XXXX"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              required
            />
          </div>
          <p className="text-xs text-slate-400">
            Your document details are encrypted and only used for identity verification.
          </p>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white transition hover:bg-blue-500 disabled:opacity-60"
            >
              {loading ? 'Submitting…' : 'Submit for Verification'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-black text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

/* ─── Main Profile page ─────────────────────────────────── */
export default function Profile() {
  const { user } = useAuth()
  const [profile, setProfile]   = useState(null)
  const [editing, setEditing]   = useState(false)
  const [formData, setFormData] = useState({})
  const [loading, setLoading]   = useState(true)
  const [profileImage, setProfileImage]   = useState(null)
  const [imagePreview, setImagePreview]   = useState(null)
  const [showPwModal, setShowPwModal]     = useState(false)
  const [pwData, setPwData] = useState({ old_password: '', new_password: '', confirm_password: '' })
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [roleChoice, setRoleChoice] = useState(null)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [roleChanging, setRoleChanging] = useState('')
  const [sessionRates, setSessionRates] = useState([])
  const [rateInputs, setRateInputs] = useState({ video: '', phone: '', chat: '', in_person: '' })
  const [ratesSaving, setRatesSaving] = useState(false)

  const handleRoleChange = async (newRole) => {
    if (newRole === roleChoice) return
    if (newRole === 'both' && !profile.is_premium) { setShowPremiumModal(true); return }

    const ROLE_LABELS = { freelancer: 'Freelancer', consultant: 'Consultant', both: 'Both (Freelancer + Consultant)' }
    const result = await Swal.fire({
      title: `Switch to ${ROLE_LABELS[newRole]}?`,
      html: `<p style="color:#64748b;font-size:14px">Your dashboard, sidebar, and available features will update to match the <strong>${ROLE_LABELS[newRole]}</strong> role.<br><br>Any unsaved form changes will be lost. The page will reload.</p>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: newRole === 'consultant' ? '#2563eb' : newRole === 'both' ? '#7c3aed' : '#059669',
      cancelButtonColor: '#64748b',
      confirmButtonText: `Yes, switch to ${ROLE_LABELS[newRole]}`,
      cancelButtonText: 'Cancel',
    })
    if (!result.isConfirmed) return

    setRoleChanging(newRole)
    try {
      const fd = new FormData()
      fd.append('role', newRole)
      await api.patch('/auth/profile/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      window.location.reload()
    } catch (e) {
      setRoleChanging('')
      Swal.fire({ icon: 'error', title: 'Failed', text: e.response?.data?.role?.[0] || e.response?.data?.detail || 'Could not change role.' })
    }
  }

  useEffect(() => {
    fetchProfile()
    if (['consultant', 'both'].includes(user?.role)) {
      api.get('/consultations/session-rates/').then(res => {
        const rates = Array.isArray(res.data) ? res.data : res.data.results || []
        setSessionRates(rates)
        const inputs = { video: '', phone: '', chat: '', in_person: '' }
        rates.forEach(r => { inputs[r.session_type] = r.hourly_rate })
        setRateInputs(inputs)
      }).catch(() => {})
    }
  }, [])

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const res = await api.get('/auth/profile/')
      setProfile(res.data)
      setFormData({
        first_name: res.data.first_name || '',
        last_name: res.data.last_name || '',
        timezone: res.data.timezone || 'Asia/Kolkata',
        is_online: res.data.is_online || false,
        // From registration — all roles
        phone: res.data.phone || '',
        state: res.data.state || '',
        identity: res.data.identity || '',
        // From registration — freelancer/consultant
        working_industry: res.data.working_industry || '',
        experience_description: res.data.experience_description || '',
        // From registration — client interests
        interest1: res.data.interest1 || '',
        interest2: res.data.interest2 || '',
        interest3: res.data.interest3 || '',
        // Professional fields
        headline: res.data.headline || '',
        years_of_experience: res.data.years_of_experience || '',
        languages: res.data.languages || '',
        preferred_communication: res.data.preferred_communication || '',
        response_time_hours: res.data.response_time_hours || 24,
        // About
        what_i_help_with: res.data.what_i_help_with || '',
        ideal_client: res.data.ideal_client || '',
        // Social links
        linkedin_url: res.data.linkedin_url || '',
        twitter_url: res.data.twitter_url || '',
        github_url: res.data.github_url || '',
        website_url: res.data.website_url || '',
        portfolio_url: res.data.portfolio_url || '',
        // Bio & location
        bio: res.data.bio || '',
        location: res.data.location || '',
        hourly_rate: res.data.hourly_rate || '',
      })
      setRoleChoice(res.data.role)
      if (res.data.profile_image) setImagePreview(res.data.profile_image)
    } catch {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load profile.' })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveRates = async () => {
    setRatesSaving(true)
    try {
      const SESSION_TYPES = [
        { key: 'video', label: 'Video Call' },
        { key: 'phone', label: 'Phone Call' },
        { key: 'chat', label: 'Chat' },
        { key: 'in_person', label: 'In Person' },
      ]
      for (const { key } of SESSION_TYPES) {
        const rate = rateInputs[key]
        if (!rate && rate !== 0) continue
        const existing = sessionRates.find(r => r.session_type === key)
        if (existing) {
          await api.patch(`/consultations/session-rates/${existing.id}/`, { hourly_rate: rate, is_active: true })
        } else {
          await api.post('/consultations/session-rates/', { session_type: key, hourly_rate: rate, is_active: true })
        }
      }
      const res = await api.get('/consultations/session-rates/')
      const rates = Array.isArray(res.data) ? res.data : res.data.results || []
      setSessionRates(rates)
      Swal.fire({ icon: 'success', title: 'Rates saved!', timer: 1200, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'Failed', text: 'Could not save session rates.' })
    } finally {
      setRatesSaving(false)
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 200000) { Swal.fire({ icon: 'warning', title: 'Too large', text: 'Image must be under 200 KB.' }); return }
    if (!file.type.startsWith('image/')) { Swal.fire({ icon: 'warning', title: 'Invalid', text: 'Please upload an image.' }); return }
    setProfileImage(file)
    const reader = new FileReader()
    reader.onload = e => setImagePreview(e.target.result)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (roleChoice === 'both' && !profile.is_premium) {
      setShowPremiumModal(true)
      return
    }
    try {
      const fd = new FormData()
      fd.append('first_name', formData.first_name)
      fd.append('last_name', formData.last_name)
      if (formData.timezone) fd.append('timezone', formData.timezone)
      fd.append('is_online', formData.is_online ? 'true' : 'false')
      if (roleChoice && roleChoice !== profile.role) fd.append('role', roleChoice)
      if (profileImage) fd.append('profile_image', profileImage)
      // Professional fields
      if (formData.headline !== undefined) fd.append('headline', formData.headline)
      if (formData.years_of_experience !== '') fd.append('years_of_experience', formData.years_of_experience)
      if (formData.languages !== undefined) fd.append('languages', formData.languages)
      if (formData.preferred_communication !== undefined) fd.append('preferred_communication', formData.preferred_communication)
      if (formData.response_time_hours !== '') fd.append('response_time_hours', formData.response_time_hours)
      if (formData.what_i_help_with !== undefined) fd.append('what_i_help_with', formData.what_i_help_with)
      if (formData.ideal_client !== undefined) fd.append('ideal_client', formData.ideal_client)
      if (formData.linkedin_url !== undefined) fd.append('linkedin_url', formData.linkedin_url)
      if (formData.twitter_url !== undefined) fd.append('twitter_url', formData.twitter_url)
      if (formData.github_url !== undefined) fd.append('github_url', formData.github_url)
      if (formData.website_url !== undefined) fd.append('website_url', formData.website_url)
      if (formData.portfolio_url !== undefined) fd.append('portfolio_url', formData.portfolio_url)
      if (formData.bio !== undefined) fd.append('bio', formData.bio)
      if (formData.location !== undefined) fd.append('location', formData.location)
      if (formData.hourly_rate !== '') fd.append('hourly_rate', formData.hourly_rate)
      // Registration fields — all roles
      fd.append('phone', formData.phone || '')
      fd.append('state', formData.state || '')
      fd.append('identity', formData.identity || '')
      // Registration fields — freelancer/consultant/both
      if (['consultant', 'freelancer', 'both'].includes(user?.role)) {
        fd.append('working_industry', formData.working_industry || '')
        fd.append('experience_description', formData.experience_description || '')
      }
      // Registration fields — client interests
      if (user?.role === 'client') {
        fd.append('interest1', formData.interest1 || '')
        fd.append('interest2', formData.interest2 || '')
        fd.append('interest3', formData.interest3 || '')
      }
      const res = await api.put('/auth/profile/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setProfile(res.data)
      setEditing(false)
      setProfileImage(null)
      Swal.fire({ icon: 'success', title: 'Saved!', timer: 1500, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'Failed', text: 'Could not update profile.' })
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (pwData.new_password !== pwData.confirm_password) {
      Swal.fire({ icon: 'warning', title: 'Mismatch', text: 'Passwords do not match.' }); return
    }
    if (pwData.new_password.length < 6) {
      Swal.fire({ icon: 'warning', title: 'Too short', text: 'Password must be at least 6 characters.' }); return
    }
    try {
      await api.post('/auth/change-password/', { old_password: pwData.old_password, new_password: pwData.new_password })
      setShowPwModal(false)
      setPwData({ old_password: '', new_password: '', confirm_password: '' })
      Swal.fire({ icon: 'success', title: 'Password changed!', timer: 1500, showConfirmButton: false })
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Failed', text: err.response?.data?.detail || 'Could not change password.' })
    }
  }

  /* ── Skeleton loader ── */
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-slate-200" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex flex-col items-center gap-4">
              <div className="h-24 w-24 rounded-full bg-slate-200" />
              <div className="h-5 w-32 rounded bg-slate-200" />
              <div className="h-4 w-24 rounded bg-slate-100" />
            </div>
          </div>
          <div className="space-y-4 lg:col-span-2">
            {[1,2,3].map(i => <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-white p-6 h-24" />)}
          </div>
        </div>
      </div>
    )
  }

  if (!profile) return null

  const kyc = profile.kyc_status || 'unverified'
  const name = profile.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : profile.username
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Account</p>
        <h1 className="mt-1 text-2xl font-black text-slate-950">My Profile</h1>
      </div>

      <ProfileStrengthMeter pct={profile.profile_completion_pct} />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Left: avatar card ── */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center gap-4 text-center">
            {/* Avatar */}
            <div className="relative">
              {imagePreview ? (
                <img src={imagePreview} alt="Profile" className="h-24 w-24 rounded-full border-4 border-blue-100 object-cover" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-blue-100 bg-blue-600 text-2xl font-black text-white">
                  {initials}
                </div>
              )}
              {/* Verified tick overlay */}
              {kyc === 'verified' && (
                <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-blue-500 text-white">
                  <FaCircleCheck className="text-xs" />
                </span>
              )}
            </div>

            <div>
              <p className="font-black text-slate-950">{name}</p>
              <p className="text-sm text-slate-500">@{profile.username}</p>
              <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-black capitalize ${
                profile.role === 'admin' ? 'bg-rose-100 text-rose-700' :
                profile.role === 'client' ? 'bg-blue-100 text-blue-700' :
                profile.role === 'both' ? 'bg-purple-100 text-purple-700' :
                'bg-emerald-100 text-emerald-700'
              }`}>
                {profile.role === 'both' ? 'Freelancer + Consultant' : profile.role}
                {profile.is_premium && <span className="ml-1">⭐</span>}
              </span>
            </div>

            {editing ? (
              <label className="cursor-pointer text-xs font-black text-blue-600 hover:underline">
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                Change Photo
              </label>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
              >
                <FaPen className="text-[10px]" /> Edit Profile
              </button>
            )}
          </div>

          {/* Quick info */}
          <div className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <FaEnvelope className="shrink-0 text-slate-400" />
              <span className="truncate">{profile.email}</span>
            </div>
            {profile.phone && (
              <div className="flex items-center gap-2 text-slate-600">
                <FaPhone className="shrink-0 text-slate-400" />
                <span>{profile.phone}</span>
              </div>
            )}
            {profile.state && (
              <div className="flex items-center gap-2 text-slate-600">
                <FaLocationDot className="shrink-0 text-slate-400" />
                <span>{profile.state}</span>
              </div>
            )}
            {profile.working_industry && (
              <div className="flex items-center gap-2 text-slate-600">
                <FaBriefcase className="shrink-0 text-slate-400" />
                <span>{profile.working_industry}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: edit form + KYC + password ── */}
        <div className="space-y-5 lg:col-span-2">

          {/* Profile edit / display */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 font-black text-slate-950">Personal Information</h2>
            {editing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">First Name</label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={e => setFormData(p => ({ ...p, first_name: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">Last Name</label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={e => setFormData(p => ({ ...p, last_name: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>
                {/* Phone, State — all roles */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                      placeholder="+91 9876543210"
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">State / Region</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={e => setFormData(p => ({ ...p, state: e.target.value }))}
                      placeholder="e.g. Maharashtra"
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>
                {/* Identity — all roles */}
                <div>
                  <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">Identity / Entity Type</label>
                  <select
                    value={formData.identity}
                    onChange={e => setFormData(p => ({ ...p, identity: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="">Select…</option>
                    {user?.role === 'client'
                      ? ['Enterprise', 'MSME', 'Professional', 'Self-Employed', 'Individual'].map(v => <option key={v} value={v}>{v}</option>)
                      : ['Consultant', 'Trainer', 'Mentor', 'Expert', 'Firm'].map(v => <option key={v} value={v}>{v}</option>)
                    }
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={e => setFormData(p => ({ ...p, bio: e.target.value }))}
                    rows={3}
                    placeholder="Tell clients about yourself…"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">Location</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={e => setFormData(p => ({ ...p, location: e.target.value }))}
                      placeholder="City, Country"
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">Hourly Rate (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.hourly_rate}
                      onChange={e => setFormData(p => ({ ...p, hourly_rate: e.target.value }))}
                      placeholder="e.g. 1500"
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>
                {['consultant', 'freelancer', 'both'].includes(user?.role) && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">Timezone</label>
                      <select
                        value={formData.timezone || 'Asia/Kolkata'}
                        onChange={e => setFormData(p => ({ ...p, timezone: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      >
                        {[
                          'Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Asia/Tokyo',
                          'Europe/London', 'Europe/Paris', 'Europe/Berlin',
                          'America/New_York', 'America/Chicago', 'America/Los_Angeles',
                          'Australia/Sydney', 'Pacific/Auckland',
                        ].map(tz => <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>)}
                      </select>
                    </div>
                    <div className="flex items-end pb-1">
                      <label className="flex cursor-pointer items-center gap-3">
                        <input
                          type="checkbox"
                          checked={!!formData.is_online}
                          onChange={e => setFormData(p => ({ ...p, is_online: e.target.checked }))}
                          className="h-4 w-4 rounded border-slate-300 accent-emerald-500"
                        />
                        <div>
                          <p className="text-sm font-black text-slate-900">Mark as Online</p>
                          <p className="text-xs text-slate-400">Show green dot on your profile</p>
                        </div>
                      </label>
                    </div>
                  </div>
                )}
                {/* Consultant/Freelancer professional fields */}
                {['consultant', 'freelancer', 'both'].includes(user?.role) && (
                  <>
                    <div>
                      <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">Professional Headline</label>
                      <input
                        type="text"
                        value={formData.headline}
                        onChange={e => setFormData(p => ({ ...p, headline: e.target.value }))}
                        placeholder="e.g. Senior React Developer | 8 yrs | Startup Advisor"
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">Years of Experience</label>
                        <input type="number" min="0" max="50" value={formData.years_of_experience} onChange={e => setFormData(p => ({ ...p, years_of_experience: e.target.value }))} placeholder="e.g. 8" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100" />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">Languages Spoken</label>
                        <input type="text" value={formData.languages} onChange={e => setFormData(p => ({ ...p, languages: e.target.value }))} placeholder="e.g. English, Hindi" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100" />
                      </div>
                    </div>
                  </>
                )}
                {/* Industry + Experience Description — freelancer/consultant/both */}
                {['consultant', 'freelancer', 'both'].includes(user?.role) && (
                  <>
                    <div>
                      <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">Working Industry</label>
                      <input
                        type="text"
                        value={formData.working_industry}
                        onChange={e => setFormData(p => ({ ...p, working_industry: e.target.value }))}
                        placeholder="e.g. FinTech, Healthcare, E-commerce"
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">Experience Summary</label>
                      <textarea
                        value={formData.experience_description}
                        onChange={e => setFormData(p => ({ ...p, experience_description: e.target.value }))}
                        rows={3}
                        placeholder="Brief summary of your professional background…"
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 resize-none"
                      />
                    </div>
                  </>
                )}
                {/* Interests — client only */}
                {user?.role === 'client' && (
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">Interests / Areas You Need Help With</label>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {[
                        { key: 'interest1', placeholder: 'e.g. Digital Marketing' },
                        { key: 'interest2', placeholder: 'e.g. Legal & Compliance' },
                        { key: 'interest3', placeholder: 'e.g. Financial Planning' },
                      ].map(({ key, placeholder }) => (
                        <input
                          key={key}
                          type="text"
                          value={formData[key]}
                          onChange={e => setFormData(p => ({ ...p, [key]: e.target.value }))}
                          placeholder={placeholder}
                          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                        />
                      ))}
                    </div>
                  </div>
                )}
                {['consultant', 'both'].includes(user?.role) && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">Preferred Communication</label>
                      <select value={formData.preferred_communication} onChange={e => setFormData(p => ({ ...p, preferred_communication: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100">
                        <option value="">Select…</option>
                        <option value="chat">Chat</option>
                        <option value="email">Email</option>
                        <option value="call">Call</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">Response Time (hours)</label>
                      <input type="number" min="1" max="168" value={formData.response_time_hours} onChange={e => setFormData(p => ({ ...p, response_time_hours: e.target.value }))} placeholder="24" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100" />
                    </div>
                  </div>
                )}
                {/* Session Rates — consultant / both */}
                {['consultant', 'both'].includes(user?.role) && (
                  <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-black text-slate-950">Session Rates</p>
                        <p className="text-xs text-slate-500">Set your hourly rate per session type. Clients see these when booking.</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleSaveRates}
                        disabled={ratesSaving}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-black text-white transition hover:bg-blue-500 disabled:opacity-60"
                      >
                        {ratesSaving ? 'Saving…' : 'Save Rates'}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: 'video', label: 'Video Call', icon: '📹' },
                        { key: 'phone', label: 'Phone Call', icon: '📞' },
                        { key: 'chat', label: 'Chat', icon: '💬' },
                        { key: 'in_person', label: 'In Person', icon: '🤝' },
                      ].map(({ key, label, icon }) => (
                        <div key={key}>
                          <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-500">{icon} {label}</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">₹</span>
                            <input
                              type="number"
                              min="0"
                              value={rateInputs[key]}
                              onChange={e => setRateInputs(p => ({ ...p, [key]: e.target.value }))}
                              placeholder="e.g. 999"
                              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-7 pr-3 text-sm font-semibold outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                            />
                          </div>
                          <p className="mt-0.5 text-[9px] text-slate-400">/hr</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {user?.role !== 'admin' && user?.role !== 'client' && (
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">Your Role</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'freelancer', label: 'Freelancer', color: 'emerald' },
                        { value: 'consultant', label: 'Consultant', color: 'blue' },
                        { value: 'both', label: 'Both ⭐', color: 'purple', premium: true },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          disabled={!!roleChanging}
                          onClick={() => handleRoleChange(opt.value)}
                          className={`rounded-xl border px-3 py-2.5 text-xs font-black transition disabled:opacity-50 disabled:cursor-not-allowed ${
                            roleChoice === opt.value
                              ? opt.value === 'both' ? 'border-purple-400 bg-purple-100 text-purple-800'
                                : opt.value === 'consultant' ? 'border-blue-400 bg-blue-100 text-blue-800'
                                : 'border-emerald-400 bg-emerald-100 text-emerald-800'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                          } ${opt.premium && !profile.is_premium ? 'opacity-60' : ''}`}
                        >
                          {opt.label}
                          {opt.premium && !profile.is_premium && <span className="ml-1 text-[9px] text-purple-400">Premium</span>}
                          {roleChanging === opt.value && (
                            <span className="ml-1.5 inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin align-middle" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white hover:bg-blue-500">
                    Save Changes
                  </button>
                  <button type="button" onClick={() => setEditing(false)} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-black text-slate-600 hover:bg-slate-50">
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  {[
                    { label: 'Username',   val: profile.username },
                    { label: 'Email',      val: profile.email },
                    { label: 'First Name', val: profile.first_name || '—' },
                    { label: 'Last Name',  val: profile.last_name  || '—' },
                    { label: 'Role',       val: profile.role === 'both' ? 'Freelancer + Consultant' : profile.role, cap: true },
                    { label: 'Identity',   val: profile.identity || '—' },
                    profile.phone && { label: 'Phone', val: profile.phone },
                    profile.state && { label: 'State / Region', val: profile.state },
                  ].filter(Boolean).map(({ label, val, cap }) => (
                    <div key={label}>
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</p>
                      <p className={`mt-1 font-semibold text-slate-900 ${cap ? 'capitalize' : ''}`}>{val}</p>
                    </div>
                  ))}
                </div>
                {profile.bio && (
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">Bio</p>
                    <p className="mt-1 text-sm text-slate-700 leading-relaxed">{profile.bio}</p>
                  </div>
                )}
                {(profile.location || profile.hourly_rate) && (
                  <div className="grid grid-cols-2 gap-5">
                    {profile.location && <div><p className="text-xs font-black uppercase tracking-wide text-slate-400">Location</p><p className="mt-1 font-semibold text-slate-900">{profile.location}</p></div>}
                    {profile.hourly_rate && <div><p className="text-xs font-black uppercase tracking-wide text-slate-400">Hourly Rate</p><p className="mt-1 font-semibold text-slate-900">₹{Number(profile.hourly_rate).toLocaleString('en-IN')}/hr</p></div>}
                  </div>
                )}
                {/* Freelancer/Consultant: working industry + experience */}
                {['consultant', 'freelancer', 'both'].includes(profile.role) && (profile.working_industry || profile.experience_description) && (
                  <div className="space-y-3 border-t border-slate-100 pt-4">
                    {profile.working_industry && (
                      <div>
                        <p className="text-xs font-black uppercase tracking-wide text-slate-400">Working Industry</p>
                        <p className="mt-1 font-semibold text-slate-900">{profile.working_industry}</p>
                      </div>
                    )}
                    {profile.experience_description && (
                      <div>
                        <p className="text-xs font-black uppercase tracking-wide text-slate-400">Experience Summary</p>
                        <p className="mt-1 text-sm text-slate-700 leading-relaxed">{profile.experience_description}</p>
                      </div>
                    )}
                  </div>
                )}
                {/* Client: interests */}
                {profile.role === 'client' && (profile.interest1 || profile.interest2 || profile.interest3) && (
                  <div className="border-t border-slate-100 pt-4">
                    <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-400">Areas of Interest</p>
                    <div className="flex flex-wrap gap-2">
                      {[profile.interest1, profile.interest2, profile.interest3].filter(Boolean).map((interest, i) => (
                        <span key={i} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">{interest}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Expertise tags — consultants, freelancers & both */}
          {['consultant', 'freelancer', 'both'].includes(user?.role) && <ExpertiseTagsSection />}

          {/* About Your Consulting — consultant & both */}
          {['consultant', 'both'].includes(user?.role) && editing && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <FaLightbulb className="text-amber-500" />
                <p className="font-black text-slate-950">About Your Consulting</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">What I Help With</label>
                  <textarea value={formData.what_i_help_with} onChange={e => setFormData(p => ({ ...p, what_i_help_with: e.target.value }))} rows={3} placeholder="Describe the problems you solve for clients…" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 resize-none" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">Ideal Client</label>
                  <textarea value={formData.ideal_client} onChange={e => setFormData(p => ({ ...p, ideal_client: e.target.value }))} rows={2} placeholder="Describe your ideal client (industry, stage, challenges)…" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 resize-none" />
                </div>
              </div>
            </div>
          )}
          {['consultant', 'both'].includes(user?.role) && !editing && (profile.what_i_help_with || profile.ideal_client) && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <FaLightbulb className="text-amber-500" />
                <p className="font-black text-slate-950">About Your Consulting</p>
              </div>
              {profile.what_i_help_with && (
                <div className="mb-3">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400 mb-1">What I Help With</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{profile.what_i_help_with}</p>
                </div>
              )}
              {profile.ideal_client && (
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400 mb-1">Ideal Client</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{profile.ideal_client}</p>
                </div>
              )}
            </div>
          )}

          {/* Social & External Links */}
          {['consultant', 'freelancer', 'both'].includes(user?.role) && editing && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <FaLink className="text-slate-500" />
                <p className="font-black text-slate-950">Social & Links</p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  { key: 'linkedin_url', label: 'LinkedIn', icon: FaLinkedin, color: 'text-blue-600', placeholder: 'https://linkedin.com/in/…' },
                  { key: 'twitter_url', label: 'Twitter / X', icon: FaXTwitter, color: 'text-slate-900', placeholder: 'https://twitter.com/…' },
                  { key: 'github_url', label: 'GitHub', icon: FaGithub, color: 'text-slate-700', placeholder: 'https://github.com/…' },
                  { key: 'website_url', label: 'Website', icon: FaGlobe, color: 'text-emerald-600', placeholder: 'https://yoursite.com' },
                  { key: 'portfolio_url', label: 'Portfolio', icon: FaLink, color: 'text-indigo-600', placeholder: 'https://portfolio.com' },
                ].map(({ key, label, icon: Icon, color, placeholder }) => (
                  <div key={key}>
                    <label className="mb-1 flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-slate-600">
                      <Icon className={`text-sm ${color}`} /> {label}
                    </label>
                    <input type="url" value={formData[key]} onChange={e => setFormData(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100" />
                  </div>
                ))}
              </div>
            </div>
          )}
          {['consultant', 'freelancer', 'both'].includes(user?.role) && !editing && (
            profile.linkedin_url || profile.twitter_url || profile.github_url || profile.website_url || profile.portfolio_url
          ) && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <FaLink className="text-slate-500" />
                <p className="font-black text-slate-950">Social & Links</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {profile.linkedin_url && <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700 hover:bg-blue-100"><FaLinkedin /> LinkedIn</a>}
                {profile.twitter_url && <a href={profile.twitter_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"><FaXTwitter /> Twitter</a>}
                {profile.github_url && <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"><FaGithub /> GitHub</a>}
                {profile.website_url && <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"><FaGlobe /> Website</a>}
                {profile.portfolio_url && <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"><FaLink /> Portfolio</a>}
              </div>
            </div>
          )}

          {/* Consultation Packages — consultant & both */}
          {['consultant', 'both'].includes(user?.role) && <PackagesSection />}

          {/* KYC Section — hidden for admin (they approve KYC, don't submit it) */}
          {user?.role !== 'admin' && <KYCSection profile={profile} onRefresh={fetchProfile} />}

          {/* Change Password */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                  <FaKey className="text-slate-600" />
                </div>
                <div>
                  <p className="font-black text-slate-950">Password</p>
                  <p className="text-xs text-slate-500">Keep your account secure</p>
                </div>
              </div>
              <button
                onClick={() => setShowPwModal(true)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Premium Upgrade Modal ── */}
      {showPremiumModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-purple-200 bg-white p-8 shadow-2xl text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-3xl">⭐</div>
            <h3 className="text-xl font-black text-slate-950">Premium Required</h3>
            <p className="mt-3 text-sm text-slate-500">
              The <strong>Both (Freelancer + Consultant)</strong> role is a Premium feature. It lets you bid on projects <em>and</em> accept consulting sessions from the same account.
            </p>
            <p className="mt-4 rounded-xl bg-purple-50 px-4 py-3 text-sm font-semibold text-purple-700">
              Contact an admin to upgrade your account to Premium.
            </p>
            <button
              onClick={() => setShowPremiumModal(false)}
              className="mt-6 w-full rounded-xl bg-purple-600 py-2.5 text-sm font-black text-white hover:bg-purple-500"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* ── Change Password Modal ── */}
      {showPwModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-2xl">
            <h3 className="mb-6 text-lg font-black text-slate-950">Change Password</h3>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {/* Old password */}
              <div>
                <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">Current Password</label>
                <div className="relative">
                  <input
                    type={showOld ? 'text' : 'password'}
                    value={pwData.old_password}
                    onChange={e => setPwData(p => ({ ...p, old_password: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 pr-10 text-sm font-semibold outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    required
                  />
                  <button type="button" onClick={() => setShowOld(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showOld ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              {/* New password */}
              <div>
                <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">New Password</label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={pwData.new_password}
                    onChange={e => setPwData(p => ({ ...p, new_password: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 pr-10 text-sm font-semibold outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    required
                  />
                  <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showNew ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              {/* Confirm */}
              <div>
                <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600">Confirm New Password</label>
                <input
                  type="password"
                  value={pwData.confirm_password}
                  onChange={e => setPwData(p => ({ ...p, confirm_password: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-black text-white hover:bg-blue-500">
                  Change Password
                </button>
                <button type="button" onClick={() => setShowPwModal(false)} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-black text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
