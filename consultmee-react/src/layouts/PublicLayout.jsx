import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import Footer from '../components/marketing/Footer'
import Header from '../components/marketing/Header'
import ScrollToTop from '../components/utils/ScrollToTop'

function PublicLayout() {
  const location = useLocation()

  return (
    <div className="page-surface min-h-screen bg-slate-50 text-slate-950">
      <ScrollToTop />
      <Header />
      <motion.main
        key={location.pathname}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      >
        <Outlet />
      </motion.main>
      <Footer />
    </div>
  )
}

export default PublicLayout
