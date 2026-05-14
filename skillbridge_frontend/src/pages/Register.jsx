import { useNavigate, Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FaArrowRight, FaCircleCheck, FaBriefcase, FaUserTie, FaLayerGroup,
} from 'react-icons/fa6'
import { useAuth } from '../hooks/useAuth'

const roleCards = [
  {
    value: 'freelancer',
    label: 'Freelancer',
    icon: FaBriefcase,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    accent: 'hover:border-emerald-500/50',
    description: 'Browse projects, submit proposals, apply to jobs and build your portfolio.',
    tag: 'For independent workers',
    perks: ['Submit project proposals', 'Apply to job listings', 'Track earnings'],
  },
  {
    value: 'consultant',
    label: 'Consultant',
    icon: FaUserTie,
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    accent: 'hover:border-violet-500/50',
    description: 'Offer expert sessions, manage availability, and set your own session rates.',
    tag: 'For domain experts',
    perks: ['Offer paid sessions', 'Set availability slots', 'Manage client bookings'],
  },
  {
    value: 'both',
    label: 'Both',
    icon: FaLayerGroup,
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    accent: 'hover:border-purple-500/50',
    description: 'Freelance work + consulting sessions — the complete professional toolkit.',
    tag: 'For versatile professionals',
    perks: ['Everything in Freelancer', 'Everything in Consultant', 'Unified earnings dashboard'],
  },
]

export default function Register() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  const handleRoleSelect = (role) => {
    navigate('/register/freelancer', { state: { role: role.value } })
  }

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

        {/* ── Right: Role selection panel ── */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.32 }}
          className="rounded-2xl border border-white/10 bg-white/[0.06] p-8 shadow-[0_32px_100px_rgba(0,0,0,0.5)] backdrop-blur-xl"
        >
          <h2 className="text-2xl font-black text-white">Create an account</h2>
          <p className="mt-1 text-sm text-slate-400">What best describes you?</p>
          <div className="mt-1 h-0.5 w-48 bg-gradient-to-r from-blue-600 to-emerald-400" />

          <div className="mt-7 grid gap-4">
            {roleCards.map((role) => {
              const Icon = role.icon
              return (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => handleRoleSelect(role)}
                  className={`flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.05] p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/[0.09] ${role.accent}`}
                >
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${role.iconBg}`}>
                    <Icon className={`text-lg ${role.iconColor}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-white">{role.label}</h3>
                      <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-black text-slate-400">{role.tag}</span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-400">{role.description}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5">
                      {role.perks.map(p => (
                        <span key={p} className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                          <FaCircleCheck className="text-[9px] text-emerald-400" /> {p}
                        </span>
                      ))}
                    </div>
                  </div>
                  <FaArrowRight className="mt-1 shrink-0 text-xs text-slate-500" />
                </button>
              )
            })}
          </div>

          <p className="mt-8 text-sm font-semibold text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-black text-blue-400 hover:text-blue-300">Log in</Link>
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Looking to hire or book consultants?{' '}
            <Link to="/register/client" className="font-black text-slate-400 hover:text-white">Sign up as client →</Link>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
