import { Link } from 'react-router-dom'
import { roleOptions } from '../../data'

function AuthChoicePage({ mode }) {
  const options = roleOptions[mode]
  const isSignup = mode === 'signup'

  return (
    <section className="px-4 py-20 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-600">ConsultME</p>
          <h1 className="mt-3 text-4xl font-black text-slate-950">{isSignup ? 'Choose Signup Role' : 'Choose Login Role'}</h1>
          <p className="mt-4 text-slate-600">Select how you want to {isSignup ? 'join' : 'login to'} ConsultME.</p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {options.map((option) => {
            const Icon = option.icon
            return (
              <Link key={option.title} to={option.to} className="group rounded-lg border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl">
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-blue-50 text-2xl text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                  <Icon />
                </div>
                <h2 className="mt-6 text-2xl font-black text-slate-950">{option.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{option.description}</p>
                <span className="mt-6 inline-flex text-sm font-black text-blue-700">{isSignup ? 'Continue signup' : 'Continue login'}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default AuthChoicePage
