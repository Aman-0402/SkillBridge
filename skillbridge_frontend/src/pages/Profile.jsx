import { useState, useEffect } from 'react'
import {
  FaUser, FaEnvelope, FaPhone, FaLocationDot, FaBriefcase,
  FaShieldHalved, FaCircleCheck, FaClock, FaXmark, FaPen,
  FaKey, FaIdCard, FaEye, FaEyeSlash,
} from 'react-icons/fa6'
import Swal from 'sweetalert2'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'

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

  useEffect(() => { fetchProfile() }, [])

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const res = await api.get('/auth/profile/')
      setProfile(res.data)
      setFormData({ first_name: res.data.first_name || '', last_name: res.data.last_name || '' })
      if (res.data.profile_image) setImagePreview(res.data.profile_image)
    } catch {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load profile.' })
    } finally {
      setLoading(false)
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
    try {
      const fd = new FormData()
      fd.append('first_name', formData.first_name)
      fd.append('last_name', formData.last_name)
      if (profileImage) fd.append('profile_image', profileImage)
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
                'bg-emerald-100 text-emerald-700'
              }`}>
                {profile.role}
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
              <div className="grid grid-cols-2 gap-5">
                {[
                  { label: 'Username',   val: profile.username },
                  { label: 'Email',      val: profile.email },
                  { label: 'First Name', val: profile.first_name || '—' },
                  { label: 'Last Name',  val: profile.last_name  || '—' },
                  { label: 'Role',       val: profile.role, cap: true },
                  { label: 'Identity',   val: profile.identity || '—' },
                ].map(({ label, val, cap }) => (
                  <div key={label}>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</p>
                    <p className={`mt-1 font-semibold text-slate-900 ${cap ? 'capitalize' : ''}`}>{val}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

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
