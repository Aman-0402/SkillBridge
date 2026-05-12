import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FaArrowRight, FaEnvelope, FaLocationDot, FaPhone } from 'react-icons/fa6'
import logo from '../../assets/newlogo.png'

const footerGroups = [
  {
    title: 'Quick Links',
    links: [
      { label: 'About Us', to: '/about' },
      { label: 'Contact Us', to: '/contact' },
      { label: 'Our Services', to: '/services' },
    ],
  },
  {
    title: 'Get Involved',
    links: [
      { label: 'Become a Freelancer', to: '/register' },
      { label: 'Freelancer Login', to: '/login' },
      { label: 'Contact', to: '/contact' },
    ],
  },
]

function Footer() {
  return (
    <footer className="relative overflow-hidden bg-slate-950 px-4 pb-8 pt-16 text-white lg:px-8">
      <motion.div
        aria-hidden="true"
        className="absolute left-1/2 top-0 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-blue-500/25 blur-3xl"
        animate={{ x: ['-50%', '-46%', '-54%', '-50%'], opacity: [0.42, 0.7, 0.5, 0.42] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute bottom-10 right-0 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl"
        animate={{ y: [0, -18, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:44px_44px] opacity-40" />

      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          whileHover={{ y: -3 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10 rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-[0_28px_90px_rgba(15,23,42,0.4)] backdrop-blur-xl sm:p-6 lg:flex lg:items-center lg:justify-between"
        >
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-300">ConsultME Network</p>
            <h2 className="mt-3 text-2xl font-black sm:text-3xl">Ready to connect with the right expert?</h2>
          </div>
          <Link
            to="/register"
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-5 py-3 text-sm font-black text-white shadow-[0_18px_40px_rgba(59,130,246,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-400 lg:mt-0"
          >
            Get Started <FaArrowRight />
          </Link>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.18 }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.08, delayChildren: 0.08 } },
          }}
          className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.2fr_0.7fr_0.7fr_1.1fr]"
        >
          <motion.div
            variants={{ hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border border-white/10 bg-white/[0.06] p-6 shadow-[0_22px_70px_rgba(15,23,42,0.32)] backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:bg-white/[0.09] hover:shadow-[0_32px_90px_rgba(37,99,235,0.18)]"
          >
            <div className="inline-flex rounded-xl bg-white p-3 shadow-lg shadow-blue-950/20">
              <img src={logo} alt="ConsultME" className="h-14 w-auto" />
            </div>
            <p className="mt-5 text-sm leading-7 text-blue-50">
              ConsultME is your partner in smart, AI-powered business consulting, helping individuals and companies grow with innovation-driven expert guidance.
            </p>
          </motion.div>

          {footerGroups.map((group) => (
            <motion.div
              key={group.title}
              variants={{ hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="pt-2"
            >
              <h3 className="text-sm font-black uppercase tracking-[0.18em] text-blue-300">{group.title}</h3>
              <div className="mt-5 flex flex-col gap-3">
                {group.links.map((link) => (
                  <Link
                    key={link.label}
                    to={link.to}
                    className="group inline-flex items-center gap-2 text-sm font-bold text-slate-300 transition duration-300 hover:translate-x-1 hover:text-white"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400 opacity-60 transition-all duration-300 group-hover:scale-150 group-hover:opacity-100 group-hover:shadow-[0_0_18px_rgba(96,165,250,0.9)]" />
                    {link.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          ))}

          <motion.div
            variants={{ hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="pt-2"
          >
            <h3 className="text-sm font-black uppercase tracking-[0.18em] text-blue-300">Contact Us</h3>
            <div className="mt-5 space-y-4 text-sm text-slate-300">
              <div className="flex gap-3 transition duration-300 hover:text-white">
                <FaLocationDot className="mt-1 shrink-0 text-blue-300" />
                <address className="not-italic leading-6">
                  2066 2nd Floor, Nazarbaug Palace, Mandvi, Near Mandvi Gate, Vadodara, Gujarat, India 390001
                </address>
              </div>
              <div className="flex items-center gap-3 transition duration-300 hover:translate-x-1 hover:text-white">
                <FaPhone className="text-blue-300" />
                <span className="font-bold">+91 8317818107</span>
              </div>
              <div className="flex items-center gap-3 transition duration-300 hover:translate-x-1 hover:text-white">
                <FaEnvelope className="text-blue-300" />
                <span className="font-bold">info@consultmee.in</span>
              </div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.45, delay: 0.18 }}
          className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between"
        >
          <p>© ConsultME, All rights reserved.</p>
          <p className="font-semibold text-slate-300">Smart consultation marketplace for modern decisions.</p>
        </motion.div>
      </div>
    </footer>
  )
}

export default Footer
