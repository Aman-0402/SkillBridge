import { motion } from 'framer-motion'

function Reveal({ children, className = '', delay = 0, as = 'div' }) {
  const Component = motion[as] || motion.div

  return (
    <Component
      initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </Component>
  )
}

export default Reveal
