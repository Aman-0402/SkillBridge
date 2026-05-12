import { useState } from 'react'
import { useNavigate, Link, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash,
  FaArrowRight, FaArrowLeft, FaCircleCheck, FaBriefcase,
} from 'react-icons/fa6'
import { useAuth } from '../hooks/useAuth'

const roleCards = [
  {
    value: 'client',
    label: 'Solution Seeker',
    icon: FaUser,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    description: 'Post projects, invite freelancers & manage work effortlessly.',
    tag: 'For businesses',
    meta: 'Quick signup',
  },
  {
    value: 'freelancer',
    label: 'Freelancer / Consultant',
    icon: FaBriefcase,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    description: 'Showcase your skills, offer consulting sessions, apply for work & build your reputation.',
    tag: 'For professionals',
    meta: 'Profile setup',
  },
]

export default function Register() {
  const navigate = useNavigate()
  const { register, isAuthenticated } = useAuth()

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  const [step, setStep] = useState(1)
  const [selectedRole, setSelectedRole] = useState(null)
  const [formData, setFormData] = useState({ username: '', email: '', password: '', password2: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showPassword2, setShowPassword2] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: '', general: '' }))
  }

  const handleRoleSelect = (role) => {
    if (role.value === 'client') {
      navigate('/register/client')
      return
    }
    navigate('/register/freelancer')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    try {
      await register(formData.username, formData.email, formData.password, formData.password2, selectedRole.value)
      navigate('/login')
    } catch (error) {
      if (typeof error === 'object') setErrors(error)
      else setErrors({ general: error })
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

  return (
    <section className="relative -mt-24 min-h-screen overflow-hidden bg-slate-950 px-4 pb-16 pt-32 lg:px-8">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.2),transparent_65%)]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-start">

        {/* ── Left branding panel ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="hidden lg:block"
        >
          <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-400">Get Started Free</p>
          <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight text-white">
            Join India's smartest consulting network.
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-400">
            Connect with verified experts, post projects, and grow faster with professional guidance.
          </p>
          <div className="mt-10 space-y-4">
            {[
              'Verified consultant network',
              'Secure JWT-based authentication',
              'Flexible roles for every user type',
              'Real-time chat & appointment booking',
            ].map((point) => (
              <div key={point} className="flex items-center gap-3 text-sm font-bold text-slate-300">
                <FaCircleCheck className="shrink-0 text-blue-400" />
                {point}
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Right form panel ── */}
        <AnimatePresence mode="wait">

          {/* STEP 1 — Role selection */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.32 }}
              className="rounded-2xl border border-white/10 bg-white/[0.06] p-8 shadow-[0_32px_100px_rgba(0,0,0,0.5)] backdrop-blur-xl"
            >
              <h2 className="text-2xl font-black text-white">Create an account</h2>
              <p className="mt-1 text-sm text-slate-400">Select how you want to join ConsultME</p>
              <div className="mt-1 h-0.5 w-48 bg-gradient-to-r from-blue-600 to-emerald-400" />

              <div className="mt-7 grid grid-cols-2 gap-4">
                {roleCards.map((role) => {
                  const Icon = role.icon
                  return (
                    <div
                      key={role.value}
                      className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.05] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-blue-500/50 hover:bg-white/[0.09]"
                    >
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${role.iconBg}`}>
                        <Icon className={`text-xl ${role.iconColor}`} />
                      </div>
                      <h3 className="mt-3 text-base font-black text-white">{role.label}</h3>
                      <p className="mt-1.5 flex-1 text-sm leading-6 text-slate-400">{role.description}</p>
                      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-full bg-white/10 px-3 py-1 font-black text-slate-300">{role.tag}</span>
                        <span className="text-slate-500">• {role.meta}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRoleSelect(role)}
                        className="mt-4 inline-flex w-fit items-center gap-2 rounded-xl border border-blue-200 px-4 py-2 text-sm font-black text-blue-700 transition hover:border-blue-600 hover:bg-blue-600 hover:text-white"
                      >
                        Signup <FaArrowRight />
                      </button>
                    </div>
                  )
                })}
              </div>

              <p className="mt-8 text-sm font-semibold text-slate-400">
                Already have an account?{' '}
                <Link to="/login" className="font-black text-blue-400 hover:text-blue-300">
                  Log in
                </Link>
              </p>
            </motion.div>
          )}

          {/* STEP 2 — Form */}
          {step === 2 && selectedRole && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.32 }}
              className="rounded-2xl border border-white/10 bg-white/[0.06] p-8 shadow-[0_32px_100px_rgba(0,0,0,0.5)] backdrop-blur-xl"
            >
              {/* Back + role badge */}
              <div className="mb-6 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => { setStep(1); setErrors({}) }}
                  className="inline-flex items-center gap-2 text-sm font-black text-slate-400 transition hover:text-white"
                >
                  <FaArrowLeft /> Back
                </button>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-black text-slate-300">
                  {(() => { const Icon = selectedRole.icon; return <Icon /> })()}
                  {selectedRole.label}
                </span>
              </div>

              <h2 className="text-2xl font-black text-white">Complete your profile</h2>
              <p className="mt-1 text-sm text-slate-400">Fill in your details to create your account.</p>
              <div className="mt-1 h-0.5 w-48 bg-gradient-to-r from-blue-600 to-emerald-400" />

              {errors.general && (
                <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">
                  {errors.general}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                    Username
                    <span className="relative">
                      <FaUser className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" />
                      <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="Choose a username" className={inputClass('username')} />
                    </span>
                    {errors.username && <span className="text-xs font-bold text-rose-500">{errors.username}</span>}
                  </label>

                  <label className="grid gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                    Email
                    <span className="relative">
                      <FaEnvelope className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" />
                      <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="your@email.com" className={inputClass('email')} />
                    </span>
                    {errors.email && <span className="text-xs font-bold text-rose-500">{errors.email}</span>}
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                    Password
                    <span className="relative">
                      <FaLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" />
                      <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" className={`${inputClass('password')} pr-12`} />
                      <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600">
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </span>
                    {errors.password && <span className="text-xs font-bold text-rose-500">{errors.password}</span>}
                  </label>

                  <label className="grid gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                    Confirm Password
                    <span className="relative">
                      <FaLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" />
                      <input type={showPassword2 ? 'text' : 'password'} name="password2" value={formData.password2} onChange={handleChange} placeholder="••••••••" className={`${inputClass('password2')} pr-12`} />
                      <button type="button" onClick={() => setShowPassword2(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600">
                        {showPassword2 ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </span>
                    {errors.password2 && <span className="text-xs font-bold text-rose-500">{errors.password2}</span>}
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-black text-white shadow-[0_14px_36px_rgba(37,99,235,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-500 disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {loading ? 'Creating account...' : <> Create Account <FaArrowRight /> </>}
                </button>
              </form>

              <p className="mt-6 text-sm font-semibold text-slate-500">
                Already have an account?{' '}
                <Link to="/login" className="font-black text-blue-600 hover:text-blue-700">
                  Log in
                </Link>
              </p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </section>
  )
}
