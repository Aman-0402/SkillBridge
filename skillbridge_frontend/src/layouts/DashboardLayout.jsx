import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FaCalendarCheck,
  FaClockRotateLeft,
  FaFolderOpen,
  FaRightFromBracket,
  FaTableColumns,
  FaUser,
  FaUserTie,
} from 'react-icons/fa6'
import logoBw from '../assets/brand/logo-bw.png'
import ScrollToTop from '../components/utils/ScrollToTop'
import { useAuth } from '../hooks/useAuth'

const sidebarLinks = [
  { label: 'Overview', to: '/dashboard', icon: FaTableColumns },
  { label: 'Consultants', to: '/consultants', icon: FaUserTie },
  { label: 'Appointments', to: '/manage-availability', icon: FaCalendarCheck },
  { label: 'Projects', to: '/projects', icon: FaFolderOpen },
  { label: 'History', to: '/earnings', icon: FaClockRotateLeft },
  { label: 'Profile', to: '/profile', icon: FaUser },
]

function DashboardLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950 lg:grid lg:grid-cols-[280px_1fr]">
      <ScrollToTop />
      <aside className="sticky top-0 z-30 hidden h-screen overflow-y-auto border-r border-white/10 bg-slate-950 px-4 py-5 text-white lg:block">
        <NavLink to="/" className="mb-8 block rounded-lg bg-white p-3">
          <img src={logoBw} alt="ConsultME" className="h-14 w-auto object-contain" />
        </NavLink>
        <nav className="space-y-2">
          {sidebarLinks.map((link) => {
            const Icon = link.icon
            return (
              <NavLink
                key={link.label}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition ${
                    isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/30' : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <Icon className="text-base" />
                {link.label}
              </NavLink>
            )
          })}
        </nav>
        <button
          onClick={handleLogout}
          className="mt-8 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-semibold text-rose-200 hover:bg-rose-500/10"
        >
          <FaRightFromBracket />
          Logout
        </button>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur lg:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">ConsultME Dashboard</p>
              <h1 className="text-xl font-black text-slate-950 sm:text-2xl">Command center</h1>
            </div>
            <NavLink to="/" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:border-blue-300 hover:text-blue-700">
              View site
            </NavLink>
          </div>
        </header>
        <motion.main
          key={location.pathname + location.search}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-7xl px-4 py-6 lg:px-8"
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  )
}

export default DashboardLayout
