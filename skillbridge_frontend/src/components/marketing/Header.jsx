import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FaBars, FaXmark } from 'react-icons/fa6'
import logo from '../../assets/newlogo.png'
import { navLinks } from '../../data'
import Button from '../ui/Button'

function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="pointer-events-none sticky top-0 z-40 px-3 py-4 sm:px-5">
      <motion.div
        initial={{ opacity: 0, y: -18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="pointer-events-auto mx-auto flex max-w-7xl items-center justify-between rounded-[2rem] border border-blue-100/80 bg-white/82 px-4 py-3 shadow-[0_24px_70px_rgba(37,99,235,0.16)] backdrop-blur-2xl lg:px-5"
      >
        <Link to="/" className="group flex items-center">
          <span className="absolute -z-10 h-12 w-28 rounded-full bg-blue-500/10 opacity-0 blur-xl transition group-hover:opacity-100" />
          <img src={logo} alt="ConsultME" className="h-12 w-auto object-contain sm:h-14" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `relative rounded-full px-4 py-2 text-sm font-black transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-slate-700 hover:bg-blue-50 hover:text-blue-700'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button to="/register" variant="secondary" className="px-4 py-2">
            Signup
          </Button>
          <Button to="/login" className="bg-blue-950 px-4 py-2 text-white shadow-blue-950/20 hover:bg-blue-800">
            Login
          </Button>
        </div>

        <button
          type="button"
          aria-label="Toggle navigation"
          onClick={() => setOpen((value) => !value)}
          className="rounded-full border border-blue-100 bg-blue-50 p-3 text-blue-950 shadow-sm md:hidden"
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
            className="pointer-events-auto mx-auto mt-3 max-w-7xl rounded-[1.5rem] border border-blue-100 bg-white/92 px-4 py-4 shadow-[0_24px_70px_rgba(37,99,235,0.16)] backdrop-blur-2xl md:hidden"
          >
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `rounded-full px-4 py-3 text-sm font-black transition ${
                      isActive ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-blue-50 hover:text-blue-700'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button to="/register" variant="secondary" className="py-2" onClick={() => setOpen(false)}>
                Signup
              </Button>
              <Button to="/login" className="bg-blue-950 py-2 text-white hover:bg-blue-800" onClick={() => setOpen(false)}>
                Login
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  )
}

export default Header
