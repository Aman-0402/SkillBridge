import { Link } from 'react-router-dom'

const variants = {
  primary: 'bg-blue-600 text-white shadow-[0_16px_35px_rgba(37,99,235,0.28)] hover:bg-blue-700 hover:shadow-[0_22px_48px_rgba(37,99,235,0.34)]',
  secondary: 'border border-blue-100 bg-white/90 text-slate-900 shadow-[0_14px_34px_rgba(15,23,42,0.08)] hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700',
  dark: 'bg-blue-950 text-white shadow-[0_16px_35px_rgba(15,23,42,0.24)] hover:bg-blue-900 hover:shadow-[0_22px_48px_rgba(15,23,42,0.28)]',
}

function Button({ children, to, variant = 'primary', className = '', ...props }) {
  const classes = `group inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-black transition-all duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0 ${variants[variant]} ${className}`

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    )
  }

  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  )
}

export default Button
