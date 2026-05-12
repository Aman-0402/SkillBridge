import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FaBars, FaXmark, FaTableColumns } from 'react-icons/fa6'
import logo from '../../assets/newlogo.png'
import { navLinks } from '../../data'
import Button from '../ui/Button'
import { useAuth } from '../../hooks/useAuth'

function Header() {
  const [open, setOpen] = useState(false)
  const { isAuthenticated } = useAuth()

  return (
    <header className="pointer-events-none sticky top-0 z-40 px-3 py-4 sm:px-5">
      <motion.div
        initial={{ opacity: 0, y: -18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="pointer-events-auto mx-auto flex max-w-7xl items-center justify-between rounded-[2rem] border border-white/10 bg-slate-950/90 px-4 py-3 shadow-[0_24px_70px_rgba(0,0,0,0.4)] backdrop-blur-2xl lg:px-5"
      >
        <Link to="/" className="group flex items-center">
          <img src={logo} alt="ConsultME" className="h-12 w-auto object-contain sm:h-14" style={{ mixBlendMode: 'screen' }} />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `relative rounded-full px-4 py-2 text-sm font-black transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <Button to="/dashboard" className="flex items-center gap-2 bg-blue-600 px-4 py-2 text-white shadow-blue-600/30 hover:bg-blue-500">
              <FaTableColumns className="text-xs" /> Dashboard
            </Button>
          ) : (
            <>
              <Button to="/register" variant="secondary" className="border-white bg-white px-4 py-2 text-slate-950 hover:bg-slate-100 hover:border-slate-100">
                Signup
              </Button>
              <Button to="/login" className="bg-blue-600 px-4 py-2 text-white shadow-blue-600/30 hover:bg-blue-500">
                Login
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label="Toggle navigation"
          onClick={() => setOpen((value) => !value)}
          className="rounded-full border border-white/20 bg-white/10 p-3 text-white shadow-sm md:hidden"
        >
          {open ? <FaXmark /> : <FaBars />}
        </button>
      </motion.div>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            className="pointer-events-auto mx-auto mt-3 max-w-7xl rounded-[1.5rem] border border-white/10 bg-slate-950/95 px-4 py-4 shadow-[0_24px_70px_rgba(0,0,0,0.4)] backdrop-blur-2xl md:hidden"
          >
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `rounded-full px-4 py-3 text-sm font-black transition ${
                      isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-4 grid gap-3" style={{ gridTemplateColumns: isAuthenticated ? '1fr' : '1fr 1fr' }}>
              {isAuthenticated ? (
                <Button to="/dashboard" className="flex items-center justify-center gap-2 bg-blue-600 py-2 text-white hover:bg-blue-500" onClick={() => setOpen(false)}>
                  <FaTableColumns className="text-xs" /> Go to Dashboard
                </Button>
              ) : (
                <>
                  <Button to="/register" variant="secondary" className="border-slate-500 bg-slate-700 py-2 text-white hover:bg-slate-600 hover:border-slate-400" onClick={() => setOpen(false)}>
                    Signup
                  </Button>
                  <Button to="/login" className="bg-blue-600 py-2 text-white hover:bg-blue-500" onClick={() => setOpen(false)}>
                    Login
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  )
}

export default Header
