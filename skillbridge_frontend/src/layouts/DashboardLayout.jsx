import { useState, useEffect, useRef, useCallback } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FaBars, FaXmark,
  FaCalendarCheck, FaClockRotateLeft, FaFolderOpen,
  FaRightFromBracket, FaTableColumns, FaUser, FaUserTie,
  FaBriefcase, FaChartPie, FaShieldHalved, FaMessage,
  FaIndianRupeeSign, FaBell, FaCircleCheck, FaFileLines, FaUsers,
} from 'react-icons/fa6'
import logoBw from '../assets/newlogo.png'
import ScrollToTop from '../components/utils/ScrollToTop'
import { useAuth } from '../hooks/useAuth'
import api from '../services/api'

/* ─── Notification helpers ───────────────────────────────── */
const TYPE_ICON = {
  proposal_accepted: '🎉', proposal_received: '📋',
  session_booked: '📅', session_confirmed: '✅',
  session_cancelled: '❌', session_completed: '🏁',
  review_received: '⭐', kyc_approved: '🔵',
  kyc_rejected: '❌', job_application: '💼', general: '🔔',
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function NotificationPanel({ onClose }) {
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchNotifs = useCallback(() => {
    api.get('/chat/notifications/list_notifications/')
      .then(res => setNotifs(Array.isArray(res.data) ? res.data : []))
      .catch(() => setNotifs([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchNotifs() }, [fetchNotifs])

  const markRead = async (id) => {
    await api.post('/chat/notifications/mark_read/', { id })
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const markAllRead = async () => {
    await api.post('/chat/notifications/mark_all_read/')
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const unread = notifs.filter(n => !n.is_read).length

  return (
    <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/60">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <p className="font-black text-slate-950">
          Notifications {unread > 0 && <span className="ml-1.5 rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-black text-white">{unread}</span>}
        </p>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <button onClick={markAllRead} className="text-xs font-black text-blue-600 hover:text-blue-700">Mark all read</button>
          )}
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><FaXmark /></button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="space-y-2 p-4">
            {[1,2,3].map(i => <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />)}
          </div>
        ) : notifs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <FaBell className="text-3xl text-slate-200" />
            <p className="text-sm text-slate-400">No notifications yet</p>
          </div>
        ) : (
          notifs.map(n => (
            <button
              key={n.id}
              onClick={() => !n.is_read && markRead(n.id)}
              className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50 ${!n.is_read ? 'bg-blue-50/60' : ''}`}
            >
              <span className="mt-0.5 shrink-0 text-lg">{TYPE_ICON[n.type] || '🔔'}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-slate-950 leading-tight">{n.title}</p>
                <p className="mt-0.5 text-xs text-slate-500 leading-snug line-clamp-2">{n.message}</p>
                <p className="mt-1 text-[10px] font-bold text-slate-400">{timeAgo(n.created_at)}</p>
              </div>
              {!n.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
            </button>
          ))
        )}
      </div>
    </div>
  )
}

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
    { label: 'Overview',     to: '/dashboard',            icon: FaTableColumns },
    { label: 'Projects',     to: '/projects',             icon: FaFolderOpen },
    { label: 'Jobs',         to: '/jobs',                 icon: FaBriefcase },
    { label: 'Clients',      to: '/clients',              icon: FaUsers },
    { label: 'Availability', to: '/manage-availability',  icon: FaCalendarCheck },
    { label: 'Templates',    to: '/proposal-templates',   icon: FaFileLines },
    { label: 'Earnings',     to: '/earnings',             icon: FaClockRotateLeft },
    { label: 'Chat',         to: '/chat',                 icon: FaMessage },
    { label: 'Profile',      to: '/profile',              icon: FaUser },
  ],
  consultant: [
    { label: 'Overview',     to: '/dashboard',            icon: FaTableColumns },
    { label: 'Sessions',     to: '/manage-availability',  icon: FaCalendarCheck },
    { label: 'Projects',     to: '/projects',             icon: FaFolderOpen },
    { label: 'Clients',      to: '/clients',              icon: FaUsers },
    { label: 'Templates',    to: '/proposal-templates',   icon: FaFileLines },
    { label: 'Earnings',     to: '/earnings',             icon: FaClockRotateLeft },
    { label: 'Chat',         to: '/chat',                 icon: FaMessage },
    { label: 'Profile',      to: '/profile',              icon: FaUser },
  ],
  both: [
    { label: 'Overview',     to: '/dashboard',            icon: FaTableColumns },
    { label: 'Projects',     to: '/projects',             icon: FaFolderOpen },
    { label: 'Jobs',         to: '/jobs',                 icon: FaBriefcase },
    { label: 'Sessions',     to: '/manage-availability',  icon: FaCalendarCheck },
    { label: 'Consultants',  to: '/consultants',          icon: FaUserTie },
    { label: 'Clients',      to: '/clients',              icon: FaUsers },
    { label: 'Templates',    to: '/proposal-templates',   icon: FaFileLines },
    { label: 'Earnings',     to: '/earnings',             icon: FaClockRotateLeft },
    { label: 'Chat',         to: '/chat',                 icon: FaMessage },
    { label: 'Profile',      to: '/profile',              icon: FaUser },
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
  const [notifOpen, setNotifOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const notifRef = useRef(null)

  const role = user?.role || 'client'

  useEffect(() => {
    const fetchCount = () => {
      api.get('/chat/notifications/unread_count/')
        .then(res => setUnreadCount(res.data.count || 0))
        .catch(() => {})
    }
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!notifOpen) return
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [notifOpen])

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
                role === 'both' ? 'bg-purple-100 text-purple-700' :
                'bg-emerald-100 text-emerald-700'
              }`}>
                {role === 'both' ? 'Freelancer + Consultant' : role.charAt(0).toUpperCase() + role.slice(1)}
              </span>

              {/* Bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => { setNotifOpen(v => !v); setUnreadCount(0) }}
                  className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
                >
                  <FaBell className="text-sm" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-black text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} />}
              </div>

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
