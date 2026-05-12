import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FaArrowRight, FaEnvelope, FaEye, FaEyeSlash, FaLock, FaShieldHalved, FaUserTie } from 'react-icons/fa6'
import Button from '../../components/ui/Button'
import { useAuth } from '../../context/AuthContext'
import { apiClient } from '../../services/apiClient'

const roleConfig = {
  'solution-seeker': {
    label: 'Solution Seeker',
    apiRole: 'solution_seeker',
    title: 'Login to ConsultME',
    subtitle: 'Access your consultants, appointments, projects, history, and profile dashboard.',
    signupTo: '/signup/solution-seeker',
    forgotTo: '/forgot-password',
    dashboardTo: '/dashboard',
    icon: FaShieldHalved,
    demoEmail: 'client@consultmee.in',
  },
  consultant: {
    label: 'Freelancer',
    apiRole: 'consultant',
    title: 'Freelancer Login',
    subtitle: 'Manage your consultant profile, appointments, requests, and matching project opportunities.',
    signupTo: '/signup/consultant',
    forgotTo: '/consultant/forgot-password',
    dashboardTo: '/dashboard',
    icon: FaUserTie,
    demoEmail: 'consultant@consultmee.in',
  },
}

function LoginPage() {
  const { role } = useParams()
  const navigate = useNavigate()
  const { setAuthSession } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState(null)
  const config = useMemo(() => roleConfig[role], [role])

  if (!config) {
    return <Navigate to="/login-account" replace />
  }

  const RoleIcon = config.icon

  async function handleSubmit(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') || '').trim()
    const password = String(formData.get('password') || '')

    if (!email || !password) {
      setStatus({ type: 'error', message: 'Please fill in all fields.' })
      return
    }

    setStatus({ type: 'loading', message: 'Signing you in...' })

    try {
      const { data } = await apiClient.post('/auth/token/', {
        email,
        password,
        role: config.apiRole,
      })

      setAuthSession(data)
      setStatus({ type: 'success', message: 'Login successful. Redirecting...' })
      navigate(config.dashboardTo)
    } catch (error) {
      const detail = error.response?.data?.detail
      const firstFieldError = error.response?.data && Object.values(error.response.data)?.[0]
      setStatus({
        type: 'error',
        message: Array.isArray(firstFieldError) ? firstFieldError[0] : detail || 'Login failed. Please check your credentials.',
      })
    }
  }

  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-28 lg:px-8 lg:pt-32">
      <div className="absolute inset-x-0 top-0 -z-10 h-96 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.18),transparent_65%)]" />
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-blue-700 shadow-[0_14px_34px_rgba(37,99,235,0.08)]">
            <RoleIcon /> {config.label}
          </span>
          <h1 className="mt-6 max-w-3xl text-5xl font-black tracking-tight text-slate-950 sm:text-6xl">{config.title}</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">{config.subtitle}</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {['Secure access', 'Fast dashboard', 'Frontend ready'].map((item) => (
              <div key={item} className="rounded-xl border border-blue-100 bg-white/80 p-4 text-sm font-black text-slate-700 shadow-[0_18px_45px_rgba(15,23,42,0.07)] backdrop-blur">
                {item}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.48, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-blue-500/10 blur-2xl" />
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-[0_32px_100px_rgba(15,23,42,0.16)] backdrop-blur-xl sm:p-8">
            <div className="mb-8">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-600">Welcome Back</p>
              <h2 className="mt-3 text-3xl font-black text-slate-950">Sign in securely</h2>
              <p className="mt-2 text-sm text-slate-500">Secure Django JWT authentication connected to MySQL.</p>
            </div>

            {status ? (
              <div
                className={`mb-5 rounded-lg border p-4 text-sm font-bold ${
                  status.type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                }`}
              >
                {status.message}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="grid gap-5">
              <label className="grid gap-2 text-sm font-black text-slate-800">
                Email
                <span className="relative">
                  <FaEnvelope className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" />
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder={config.demoEmail}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 font-semibold outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </span>
              </label>

              <label className="grid gap-2 text-sm font-black text-slate-800">
                Password
                <span className="relative">
                  <FaLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" />
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-12 font-semibold outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-blue-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </span>
              </label>

              <div className="flex flex-col justify-between gap-3 text-sm sm:flex-row sm:items-center">
                <label className="inline-flex items-center gap-2 font-bold text-slate-600">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  Remember me
                </label>
                <Link to={config.forgotTo} className="font-black text-blue-700 transition hover:text-blue-900">
                  Forgot password?
                </Link>
              </div>

              <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-[0_18px_42px_rgba(37,99,235,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-[0_24px_58px_rgba(37,99,235,0.36)]">
                Login <FaArrowRight />
              </button>
            </form>

            <div className="mt-7 rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-sm font-semibold text-slate-600">
              Don't have an account?{' '}
              <Link to={config.signupTo} className="font-black text-blue-700 hover:text-blue-900">
                Sign up
              </Link>
            </div>
          </div>

          <div className="mt-5 text-center">
            <Button to="/login-account" variant="secondary">
              Choose different login role
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default LoginPage
