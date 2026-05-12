import { FaCalendarCheck, FaFolderPlus, FaMagnifyingGlass, FaStar, FaUserTie, FaUser, FaShieldHalved } from 'react-icons/fa6'
import { dashboardMetrics, dashboardProjects, featuredConsultants } from '../../data'
import Button from '../../components/ui/Button'
import { useAuth } from '../../hooks/useAuth'

const ROLE_CONFIG = {
  client: {
    badge: 'Solution Seeker',
    badgeColor: 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/30',
    icon: FaUser,
    headline: (name) => `Welcome back, ${name}!`,
    sub: 'Find experts, post projects, and manage your consultations.',
    actions: [
      { label: 'Browse Consultants', to: '/consultants', icon: FaMagnifyingGlass, primary: true },
      { label: 'Create Project', to: '/create-project', icon: FaFolderPlus, primary: false },
    ],
  },
  freelancer: {
    badge: 'Freelancer / Consultant',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30',
    icon: FaUserTie,
    headline: (name) => `Welcome back, ${name}!`,
    sub: 'Browse projects, manage proposals, and grow your consulting career.',
    actions: [
      { label: 'Browse Projects', to: '/projects', icon: FaMagnifyingGlass, primary: true },
      { label: 'Manage Availability', to: '/manage-availability', icon: FaCalendarCheck, primary: false },
    ],
  },
  consultant: {
    badge: 'Consultant',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30',
    icon: FaUserTie,
    headline: (name) => `Welcome back, ${name}!`,
    sub: 'Manage your sessions, availability, and client consultations.',
    actions: [
      { label: 'Browse Projects', to: '/projects', icon: FaMagnifyingGlass, primary: true },
      { label: 'Manage Availability', to: '/manage-availability', icon: FaCalendarCheck, primary: false },
    ],
  },
  admin: {
    badge: 'Admin',
    badgeColor: 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/30',
    icon: FaShieldHalved,
    headline: (name) => `Welcome, ${name}!`,
    sub: 'Monitor platform activity, manage users, and review analytics.',
    actions: [
      { label: 'Admin Dashboard', to: '/admin/dashboard', icon: FaMagnifyingGlass, primary: true },
      { label: 'Admin Panel', to: '/admin/panel', icon: FaShieldHalved, primary: false },
    ],
  },
}

function DashboardHome() {
  const { user } = useAuth()

  const role = user?.role || 'client'
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.client
  const displayName = user?.first_name || user?.username || 'there'
  const RoleIcon = config.icon

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-slate-950 p-6 text-white shadow-xl shadow-slate-300/20 sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ${config.badgeColor}`}>
                <RoleIcon className="text-[10px]" />
                {config.badge}
              </span>
            </div>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">{config.headline(displayName)}</h2>
            <p className="mt-4 max-w-2xl text-slate-300">{config.sub}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            {config.actions.map((action) => {
              const Icon = action.icon
              return (
                <Button key={action.to} to={action.to} variant={action.primary ? 'primary' : 'secondary'}>
                  <Icon /> {action.label}
                </Button>
              )
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardMetrics.map((item) => (
          <article key={item.label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">{item.label}</p>
            <strong className="mt-3 block text-3xl font-black text-slate-950">{item.value}</strong>
            <span className="mt-2 block text-xs font-bold text-blue-600">{item.trend}</span>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-950">Featured Consultants</h2>
              <p className="mt-1 text-sm text-slate-500">Top-rated experts available for consultation.</p>
            </div>
            <FaCalendarCheck className="text-2xl text-blue-600" />
          </div>
          <div className="mt-5 divide-y divide-slate-100">
            {featuredConsultants.map((consultant) => (
              <div key={consultant.name} className="flex flex-col justify-between gap-4 py-4 sm:flex-row sm:items-center">
                <div>
                  <h3 className="font-black text-slate-950">{consultant.name}</h3>
                  <p className="text-sm font-semibold text-slate-600">{consultant.role}</p>
                  <p className="mt-1 text-sm text-slate-500">{consultant.expertise}</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm font-black text-amber-700">
                  <FaStar /> {consultant.rating}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">Projects</h2>
          <p className="mt-1 text-sm text-slate-500">Your active and recent project activities.</p>
          <div className="mt-5 space-y-4">
            {dashboardProjects.map((project) => (
              <article key={project.title} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-black leading-6 text-slate-950">{project.title}</h3>
                  <span className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">{project.status}</span>
                </div>
                <p className="mt-3 text-sm font-bold text-slate-500">{project.budget}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default DashboardHome
