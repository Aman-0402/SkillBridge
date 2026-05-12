import { motion } from 'framer-motion'

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 22, filter: 'blur(5px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      whileHover={{ y: -8, scale: 1.01 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      className="group relative h-full overflow-hidden rounded-xl border border-slate-200/80 bg-white p-6 shadow-[0_16px_45px_rgba(15,23,42,0.07)] transition-all duration-300 hover:border-blue-200 hover:shadow-[0_26px_70px_rgba(37,99,235,0.16)]"
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-blue-100 blur-2xl" />
      </div>
      <div className="relative mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-xl text-blue-600 shadow-inner transition duration-300 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-[0_14px_32px_rgba(37,99,235,0.28)]">
        <Icon />
      </div>
      <h3 className="relative text-lg font-black text-slate-950">{title}</h3>
      <p className="relative mt-3 text-sm leading-6 text-slate-600">{description}</p>
    </motion.article>
  )
}

export default FeatureCard
