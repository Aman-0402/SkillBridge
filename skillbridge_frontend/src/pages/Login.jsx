import { useState } from 'react'
import { useNavigate, useLocation, Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FaUser, FaLock, FaEye, FaEyeSlash, FaArrowRight, FaCircleCheck } from 'react-icons/fa6'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated } = useAuth()
  const idleLogout = location.state?.reason === 'inactivity'

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  const [formData, setFormData] = useState({ username: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: '', general: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    try {
      await login(formData.username, formData.password)
      navigate('/dashboard')
    } catch (error) {
      if (typeof error === 'string') {
        setErrors({ general: error })
      } else if (error && typeof error === 'object') {
        const { detail, non_field_errors, username, password, ...rest } = error
        const general = detail
          || (Array.isArray(non_field_errors) ? non_field_errors[0] : non_field_errors)
          || (Object.keys(rest).length === 0 ? 'Invalid credentials. Please try again.' : null)
        setErrors({
          ...(username && { username: Array.isArray(username) ? username[0] : username }),
          ...(password && { password: Array.isArray(password) ? password[0] : password }),
          ...(general && { general }),
        })
      } else {
        setErrors({ general: 'Something went wrong. Please try again.' })
      }
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
      {/* Background glows */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.2),transparent_65%)]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">

        {/* ── Left branding panel ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="hidden lg:block"
        >
          <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-400">Welcome Back</p>
          <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight text-white">
            Sign in to your ConsultME account.
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-400">
            Connect with verified experts, manage your projects, and grow with professional guidance.
          </p>
          <div className="mt-10 space-y-4">
            {[
              'Access your personalized dashboard',
              'Manage projects & consultations',
              'Real-time chat with experts',
              'Track earnings & appointments',
            ].map((point) => (
              <div key={point} className="flex items-center gap-3 text-sm font-bold text-slate-300">
                <FaCircleCheck className="shrink-0 text-blue-400" />
                {point}
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Right form panel ── */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45 }}
          className="rounded-2xl border border-white/10 bg-white/[0.06] p-8 shadow-[0_32px_100px_rgba(0,0,0,0.5)] backdrop-blur-xl"
        >
          <h2 className="text-2xl font-black text-white">Welcome back</h2>
          <p className="mt-1 text-sm text-slate-400">Sign in to continue to your dashboard.</p>
          <div className="mt-1 h-0.5 w-48 bg-gradient-to-r from-blue-600 to-emerald-400" />

          {idleLogout && (
            <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50/10 px-4 py-3 text-sm font-bold text-amber-300">
              Logged out due to inactivity. Sign in again.
            </div>
          )}

          {errors.general && (
            <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            <label className="grid gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
              Username
              <span className="relative">
                <FaUser className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Your username"
                  className={inputClass('username')}
                />
              </span>
              {errors.username && <span className="text-xs font-bold text-rose-500">{errors.username}</span>}
            </label>

            <label className="grid gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
              Password
              <span className="relative">
                <FaLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`${inputClass('password')} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </span>
              {errors.password && <span className="text-xs font-bold text-rose-500">{errors.password}</span>}
            </label>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-black text-white shadow-[0_14px_36px_rgba(37,99,235,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-500 disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {loading ? 'Signing in...' : <> Sign In <FaArrowRight /> </>}
            </button>
          </form>

          <p className="mt-6 text-sm font-semibold text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-black text-blue-400 hover:text-blue-300">
              Sign up free
            </Link>
          </p>
        </motion.div>

      </div>
    </section>
  )
}
