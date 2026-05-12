import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Swal from 'sweetalert2'
import {
  FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash,
  FaArrowRight, FaArrowLeft, FaPhone, FaCircleCheck,
  FaBriefcase, FaLocationDot, FaFileLines,
} from 'react-icons/fa6'
import { useAuth } from '../hooks/useAuth'

const IDENTITIES = ['Consultant', 'Trainer', 'Mentor', 'Expert', 'Firm']

const INDUSTRIES = [
  'Agriculture', 'Artificial Intelligence', 'Astronomy',
  'Automobiles and Auto Components', 'Business & Management', 'Capital Goods',
  'Chemicals', 'Construction', 'Consumer Durables', 'Consumer Services',
  'Defence', 'Diversified', 'Education', 'Energy',
  'Fast Moving Consumer Goods (FMCG)', 'Finance', 'Food, Beverage & Tobacco',
  'Healthcare', 'Hospitality, Tourism & Leisure', 'Technology', 'Law & Order',
  'Media, Entertainment & Publication', 'Metals & Mining',
  'Oil, Gas & Consumable Fuels', 'Power', 'Realty', 'Services',
  'Telecommunication', 'Textile', 'Transport',
]

const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
  'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
]

const STEPS = [
  { label: 'Personal Info' },
  { label: 'Professional Profile' },
  { label: 'Security' },
]

function countWords(str) {
  return str.trim() === '' ? 0 : str.trim().split(/\s+/).length
}

function validate(step, form) {
  const errs = {}

  if (step === 0) {
    if (!form.fullName.trim()) errs.fullName = 'Full name is required.'
    else if (form.fullName.trim().split(' ').length < 2) errs.fullName = 'Please enter your first and last name.'

    if (!form.username.trim()) errs.username = 'Username is required.'
    else if (!/^[a-zA-Z0-9_]{3,20}$/.test(form.username.trim())) errs.username = 'Username must be 3–20 characters (letters, numbers, underscores).'

    if (!form.phone.trim()) errs.phone = 'Phone number is required.'
    else if (!/^[6-9]\d{9}$/.test(form.phone.trim())) errs.phone = 'Enter a valid 10-digit Indian mobile number.'

    if (!form.email.trim()) errs.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = 'Enter a valid email address.'
  }

  if (step === 1) {
    if (!form.identity) errs.identity = 'Please select your identity type.'
    if (!form.industry) errs.industry = 'Please select your working industry.'
    if (!form.state) errs.state = 'Please select your state.'
    if (form.experience.trim() && countWords(form.experience) > 100) errs.experience = 'Experience must be 100 words or fewer.'
  }

  if (step === 2) {
    if (!form.password) errs.password = 'Password is required.'
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters.'
    else if (!/[A-Z]/.test(form.password)) errs.password = 'Include at least one uppercase letter.'
    else if (!/[0-9]/.test(form.password)) errs.password = 'Include at least one number.'

    if (!form.password2) errs.password2 = 'Please confirm your password.'
    else if (form.password !== form.password2) errs.password2 = 'Passwords do not match.'
  }

  return errs
}

export default function RegisterFreelancer() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    fullName: '', username: '', phone: '', email: '',
    identity: '', industry: '', state: '',
    bio: '', experience: '',
    password: '', password2: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [showPw2, setShowPw2] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'experience' && countWords(value) > 100 && value.length > form.experience.length) return
    setForm(prev => ({ ...prev, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: '', general: '' }))
  }

  const handleNext = () => {
    const errs = validate(step, form)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setStep(s => s + 1)
  }

  const handleBack = () => {
    setErrors({})
    setStep(s => s - 1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate(2, form)
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    setErrors({})
    try {
      await register(form.username.trim(), form.email.trim(), form.password, form.password2, 'freelancer', {
        full_name: form.fullName.trim(),
        phone: form.phone.trim(),
        state: form.state,
        identity: form.identity,
        working_industry: form.industry,
        experience_description: form.experience.trim(),
        bio: form.bio.trim(),
      })
      await Swal.fire({
        icon: 'success',
        title: 'Account Created!',
        html: `Welcome, <strong>${form.fullName.trim()}</strong>!<br/>Your Freelancer / Consultant account is ready. Please log in to continue.`,
        confirmButtonText: 'Go to Login',
        confirmButtonColor: '#059669',
        background: '#0f172a',
        color: '#f1f5f9',
        iconColor: '#22c55e',
        customClass: { popup: 'rounded-2xl' },
      })
      navigate('/login')
    } catch (error) {
      const msg = typeof error === 'object'
        ? Object.values(error).flat().join('<br/>')
        : String(error)
      Swal.fire({
        icon: 'error',
        title: 'Registration Failed',
        html: msg,
        confirmButtonText: 'Try Again',
        confirmButtonColor: '#059669',
        background: '#0f172a',
        color: '#f1f5f9',
        iconColor: '#f43f5e',
        customClass: { popup: 'rounded-2xl' },
      })
      if (typeof error === 'object') setErrors(error)
      setStep(0)
    } finally {
      setLoading(false)
    }
  }

  const inputClass = (field) =>
    `w-full rounded-xl border bg-slate-50 py-3 pl-11 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:bg-white focus:ring-4 ${
      errors[field]
        ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-100'
        : 'border-slate-200 focus:border-blue-400 focus:ring-blue-100'
    }`

  const selectClass = (field) =>
    `w-full rounded-xl border bg-slate-50 py-3 pl-11 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:bg-white focus:ring-4 appearance-none ${
      errors[field]
        ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-100'
        : 'border-slate-200 focus:border-blue-400 focus:ring-blue-100'
    }`

  const textareaClass = (field) =>
    `w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:bg-white focus:ring-4 resize-none ${
      errors[field]
        ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-100'
        : 'border-slate-200 focus:border-blue-400 focus:ring-blue-100'
    }`

  const wordCount = countWords(form.experience)

  return (
    <section className="relative -mt-24 min-h-screen overflow-hidden bg-slate-950 px-4 pb-16 pt-32 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.15),transparent_65%)]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-start">

        {/* ── Left panel ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="hidden lg:block"
        >
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-400">Freelancer / Consultant</p>
          <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight text-white">
            Build your consulting career on ConsultME.
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-400">
            Showcase your expertise, book sessions, apply for projects, and grow your professional reputation.
          </p>
          <div className="mt-10 space-y-4">
            {[
              'Create a verified professional profile',
              'Offer consulting & mentoring sessions',
              'Apply for freelance projects',
              'Earn & track your income easily',
            ].map((point) => (
              <div key={point} className="flex items-center gap-3 text-sm font-bold text-slate-300">
                <FaCircleCheck className="shrink-0 text-emerald-400" />
                {point}
              </div>
            ))}
          </div>

          {/* Step progress */}
          <div className="mt-12 space-y-3">
            {STEPS.map((s, i) => (
              <div key={s.label} className="flex items-center gap-3">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black transition-all ${
                  i < step ? 'bg-emerald-500 text-white' :
                  i === step ? 'bg-emerald-600 text-white ring-4 ring-emerald-600/30' :
                  'bg-white/10 text-slate-500'
                }`}>
                  {i < step ? <FaCircleCheck /> : i + 1}
                </div>
                <span className={`text-sm font-bold ${i === step ? 'text-white' : i < step ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Right form panel ── */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.32 }}
          className="rounded-2xl border border-white/10 bg-white/[0.06] p-8 shadow-[0_32px_100px_rgba(0,0,0,0.5)] backdrop-blur-xl"
        >
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <button
              type="button"
              onClick={step === 0 ? () => navigate('/register') : handleBack}
              className="inline-flex items-center gap-2 text-sm font-black text-slate-400 transition hover:text-white"
            >
              <FaArrowLeft /> Back
            </button>
            <span className="text-xs font-bold text-slate-500">Step {step + 1} of {STEPS.length}</span>
          </div>

          <h2 className="text-2xl font-black text-white">{STEPS[step].label}</h2>
          <p className="mt-1 text-sm text-slate-400">
            {step === 0 && 'Start with your basic details.'}
            {step === 1 && 'Tell clients about your professional background.'}
            {step === 2 && 'Secure your account with a strong password.'}
          </p>
          <div className="mt-1 h-0.5 w-48 bg-gradient-to-r from-emerald-600 to-blue-400" />

          {/* Mobile step dots */}
          <div className="mt-4 flex gap-2 lg:hidden">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= step ? 'bg-emerald-500' : 'bg-white/10'}`} />
            ))}
          </div>

          {errors.general && (
            <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">
              {errors.general}
            </div>
          )}

          {/* ── STEP 0: Personal Info ── */}
          {step === 0 && (
            <div className="mt-6 grid gap-4">
              <div className="grid items-start gap-4 sm:grid-cols-2">
                {/* Full Name */}
                <label className="grid gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                  Full Name *
                  <span className="relative">
                    <FaUser className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                    <input type="text" name="fullName" value={form.fullName} onChange={handleChange}
                      placeholder="Priya Mehta" className={inputClass('fullName')} />
                  </span>
                  <span className="min-h-[1rem] text-xs font-bold text-rose-500">{errors.fullName || ''}</span>
                </label>

                {/* Username */}
                <label className="grid gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                  Username *
                  <span className="relative">
                    <FaUser className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                    <input type="text" name="username" value={form.username} onChange={handleChange}
                      placeholder="e.g. priya_consults" className={inputClass('username')} />
                  </span>
                  <span className="min-h-[1rem] text-xs font-bold text-rose-500">
                    {errors.username || <span className="font-semibold text-slate-600">3–20 chars, letters/numbers/underscores</span>}
                  </span>
                </label>
              </div>

              <div className="grid items-start gap-4 sm:grid-cols-2">
                {/* Phone */}
                <label className="grid gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                  Phone Number *
                  <span className="relative">
                    <FaPhone className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                    <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                      placeholder="9876543210" maxLength={10} className={inputClass('phone')} />
                  </span>
                  <span className="min-h-[1rem] text-xs font-bold text-rose-500">{errors.phone || ''}</span>
                </label>

                {/* Email */}
                <label className="grid gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                  Email *
                  <span className="relative">
                    <FaEnvelope className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                    <input type="email" name="email" value={form.email} onChange={handleChange}
                      placeholder="you@email.com" className={inputClass('email')} />
                  </span>
                  <span className="min-h-[1rem] text-xs font-bold text-rose-500">{errors.email || ''}</span>
                </label>
              </div>

              <button type="button" onClick={handleNext}
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-black text-white shadow-[0_14px_36px_rgba(16,185,129,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-500">
                Continue <FaArrowRight />
              </button>
            </div>
          )}

          {/* ── STEP 1: Professional Profile ── */}
          {step === 1 && (
            <div className="mt-6 grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Identity */}
                <label className="grid gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                  Identity *
                  <span className="relative">
                    <FaBriefcase className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                    <select name="identity" value={form.identity} onChange={handleChange} className={selectClass('identity')}>
                      <option value="">--Select--</option>
                      {IDENTITIES.map(id => <option key={id} value={id}>{id}</option>)}
                    </select>
                  </span>
                  {errors.identity && <span className="text-xs font-bold text-rose-500">{errors.identity}</span>}
                </label>

                {/* Working Industry */}
                <label className="grid gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                  Working Industry *
                  <span className="relative">
                    <FaBriefcase className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                    <select name="industry" value={form.industry} onChange={handleChange} className={selectClass('industry')}>
                      <option value="">Select Industry</option>
                      {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                    </select>
                  </span>
                  {errors.industry && <span className="text-xs font-bold text-rose-500">{errors.industry}</span>}
                </label>
              </div>

              {/* State */}
              <label className="grid gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                State *
                <span className="relative">
                  <FaLocationDot className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                  <select name="state" value={form.state} onChange={handleChange} className={selectClass('state')}>
                    <option value="">Select State</option>
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </span>
                {errors.state && <span className="text-xs font-bold text-rose-500">{errors.state}</span>}
              </label>

              {/* Bio */}
              <label className="grid gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                Bio
                <textarea name="bio" value={form.bio} onChange={handleChange} rows={2}
                  placeholder="A short description about yourself..."
                  className={textareaClass('bio')} />
                {errors.bio && <span className="text-xs font-bold text-rose-500">{errors.bio}</span>}
              </label>

              {/* Experience */}
              <label className="grid gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                Experience
                <span className="relative">
                  <FaFileLines className="pointer-events-none absolute left-4 top-3 text-emerald-500" />
                  <textarea name="experience" value={form.experience} onChange={handleChange} rows={3}
                    placeholder="Describe your experience... (max 100 words)"
                    className={`${textareaClass('experience')} pl-11`} />
                </span>
                <div className="flex items-center justify-between">
                  {errors.experience
                    ? <span className="text-xs font-bold text-rose-500">{errors.experience}</span>
                    : <span />}
                  <span className={`text-xs font-bold ${wordCount > 90 ? wordCount >= 100 ? 'text-rose-500' : 'text-amber-400' : 'text-slate-500'}`}>
                    {wordCount} / 100 words
                  </span>
                </div>
              </label>

              <button type="button" onClick={handleNext}
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-black text-white shadow-[0_14px_36px_rgba(16,185,129,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-500">
                Continue <FaArrowRight />
              </button>
            </div>
          )}

          {/* ── STEP 2: Security ── */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
              <label className="grid gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                Password *
                <span className="relative">
                  <FaLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                  <input type={showPw ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange}
                    placeholder="Min 8 chars, 1 uppercase, 1 number" className={`${inputClass('password')} pr-12`} />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500">
                    {showPw ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </span>
                {errors.password && <span className="text-xs font-bold text-rose-500">{errors.password}</span>}
              </label>

              <label className="grid gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                Confirm Password *
                <span className="relative">
                  <FaLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                  <input type={showPw2 ? 'text' : 'password'} name="password2" value={form.password2} onChange={handleChange}
                    placeholder="Re-enter your password" className={`${inputClass('password2')} pr-12`} />
                  <button type="button" onClick={() => setShowPw2(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500">
                    {showPw2 ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </span>
                {errors.password2 && <span className="text-xs font-bold text-rose-500">{errors.password2}</span>}
              </label>

              {/* Summary */}
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-xs text-slate-400">
                <p className="mb-2 font-black uppercase tracking-wider text-slate-300">Profile Summary</p>
                <div className="grid grid-cols-2 gap-1">
                  <span className="text-slate-500">Name:</span><span className="font-bold text-white">{form.fullName}</span>
                  <span className="text-slate-500">Username:</span><span className="font-bold text-white">{form.username}</span>
                  <span className="text-slate-500">Email:</span><span className="font-bold text-white truncate">{form.email}</span>
                  <span className="text-slate-500">Identity:</span><span className="font-bold text-white">{form.identity}</span>
                  <span className="text-slate-500">Industry:</span><span className="font-bold text-white">{form.industry}</span>
                  <span className="text-slate-500">State:</span><span className="font-bold text-white">{form.state}</span>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-black text-white shadow-[0_14px_36px_rgba(16,185,129,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-500 disabled:opacity-60 disabled:hover:translate-y-0">
                {loading ? 'Creating account...' : <> Create Account <FaArrowRight /> </>}
              </button>
            </form>
          )}

          <p className="mt-6 text-sm font-semibold text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-black text-emerald-400 hover:text-emerald-300">Log in</Link>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
