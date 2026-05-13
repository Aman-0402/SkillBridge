import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FaBars, FaXmark,
  FaCalendarCheck, FaClockRotateLeft, FaFolderOpen,
  FaRightFromBracket, FaTableColumns, FaUser, FaUserTie,
  FaBriefcase, FaChartPie, FaShieldHalved, FaMessage,
  FaIndianRupeeSign,
} from 'react-icons/fa6'
import logoBw from '../assets/newlogo.png'
import ScrollToTop from '../components/utils/ScrollToTop'
import { useAuth } from '../hooks/useAuth'

const SIDEBAR_LINKS = {
  client: [
    { label: 'Overview',     to: '/dashboard',           icon: FaTableColumns },
    { label: 'Consultants',  to: '/consultants',         icon: FaUserTie },
    { label: 'Appointments', to: '/manage-availability', icon: FaCalendarCheck },
    { label: 'Projects',     to: '/projects',            icon: FaFolderOpen },
    { label: 'Chat',         to: '/chat',                icon: FaMessage },
    { label: 'Payments',     to: '/earnings',            icon: FaIndianRupeeSign },
    { label: 'Profile',      to: '/profile',             icon: FaUser },
  ],
  freelancer: [
    { label: 'Overview',     to: '/dashboard',           icon: FaTableColumns },
    { label: 'Projects',     to: '/projects',            icon: FaFolderOpen },
    { label: 'Jobs',         to: '/jobs',                icon: FaBriefcase },
    { label: 'Availability', to: '/manage-availability', icon: FaCalendarCheck },
    { label: 'Earnings',     to: '/earnings',            icon: FaClockRotateLeft },
    { label: 'Chat',         to: '/chat',                icon: FaMessage },
    { label: 'Profile',      to: '/profile',             icon: FaUser },
  ],
  consultant: [
    { label: 'Overview',     to: '/dashboard',           icon: FaTableColumns },
    { label: 'Sessions',     to: '/manage-availability', icon: FaCalendarCheck },
    { label: 'Projects',     to: '/projects',            icon: FaFolderOpen },
    { label: 'Earnings',     to: '/earnings',            icon: FaClockRotateLeft },
    { label: 'Chat',         to: '/chat',                icon: FaMessage },
    { label: 'Profile',      to: '/profile',             icon: FaUser },
  ],
  both: [
    { label: 'Overview',     to: '/dashboard',           icon: FaTableColumns },
    { label: 'Projects',     to: '/projects',            icon: FaFolderOpen },
    { label: 'Jobs',         to: '/jobs',                icon: FaBriefcase },
    { label: 'Sessions',     to: '/manage-availability', icon: FaCalendarCheck },
    { label: 'Consultants',  to: '/consultants',         icon: FaUserTie },
    { label: 'Earnings',     to: '/earnings',            icon: FaClockRotateLeft },
    { label: 'Chat',         to: '/chat',                icon: FaMessage },
    { label: 'Profile',      to: '/profile',             icon: FaUser },
  ],
  admin: [
    { label: 'Overview',       to: '/dashboard',         icon: FaTableColumns },
    { label: 'Analytics',      to: '/admin/dashboard',   icon: FaChartPie },
    { label: 'Admin Panel',    to: '/admin/panel',       icon: FaShieldHalved },
    { label: 'Projects',       to: '/projects',          icon: FaFolderOpen },
    { label: 'Consultants',    to: '/consultants',       icon: FaUserTie },
    { label: 'Chat',           to: '/chat',              icon: FaMessage },
    { label: 'Profile',        to: '/profile',           icon: FaUser },
  ],
}

function SidebarContent({ role, onLinkClick }) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const links = SIDEBAR_LINKS[role] || SIDEBAR_LINKS.client

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <>
      <NavLink to="/" className="mb-8 block px-2" onClick={onLinkClick}>
        <img src={logoBw} alt="ConsultME" className="h-14 w-auto object-contain" style={{ mixBlendMode: 'screen' }} />
      </NavLink>

      <nav className="flex-1 space-y-1">
        {links.map((link) => {
          const Icon = link.icon
          return (
            <NavLink
              key={link.to + link.label}
              to={link.to}
              onClick={onLinkClick}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/30'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon className="text-base shrink-0" />
              {link.label}
            </NavLink>
          )
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="mt-6 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-rose-300 transition hover:bg-rose-500/10 hover:text-rose-200"
      >
        <FaRightFromBracket />
        Logout
      </button>
    </>
  )
}

function DashboardLayout() {
  const location = useLocation()
  const { user } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const role = user?.role || 'client'

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950 lg:grid lg:grid-cols-[280px_1fr]">
      <ScrollToTop />

      {/* ── Desktop sidebar ── */}
      <aside className="sticky top-0 z-30 hidden h-screen flex-col overflow-y-auto border-r border-white/10 bg-slate-950 px-4 py-5 text-white lg:flex">
        <SidebarContent role={role} />
      </aside>

      {/* ── Mobile overlay ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col overflow-y-auto bg-slate-950 px-4 py-5 text-white lg:hidden"
            >
              <SidebarContent role={role} onLinkClick={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main content ── */}
      <div className="min-w-0">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur lg:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Mobile hamburger */}
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              >
                <FaBars />
              </button>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">ConsultME Dashboard</p>
                <h1 className="text-xl font-black text-slate-950 sm:text-2xl">
                  {user?.first_name ? `Hi, ${user.first_name}` : 'Command center'}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Role badge */}
              <span className={`hidden rounded-full px-3 py-1 text-xs font-black sm:inline-flex ${
                role === 'admin' ? 'bg-rose-100 text-rose-700' :
                role === 'client' ? 'bg-blue-100 text-blue-700' :
                'bg-emerald-100 text-emerald-700'
              }`}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </span>
              <NavLink
                to="/"
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:border-blue-300 hover:text-blue-700"
              >
                View site
              </NavLink>
            </div>
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
