import { useState } from 'react'
import { motion } from 'framer-motion'
import { FaEnvelope, FaLocationDot, FaPaperPlane, FaPhone } from 'react-icons/fa6'
import Button from '../../components/ui/Button'

const contactCards = [
  {
    title: 'Visit Us',
    value: '2066 2nd Floor, Nazarbaug Palace, Mandvi, Near Mandvi Gate, Vadodara, Gujarat, India 390001',
    icon: FaLocationDot,
  },
  {
    title: 'Call Us',
    value: '+91 8317818107',
    icon: FaPhone,
  },
  {
    title: 'Email Us',
    value: 'info@consultmee.in',
    icon: FaEnvelope,
  },
]

function ContactPage() {
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()
    setSubmitted(true)
    event.currentTarget.reset()
  }

  return (
    <>
      <section className="relative overflow-hidden bg-blue-950 px-4 pb-20 pt-28 text-center text-white lg:px-8 lg:pt-32">
        <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.5),transparent_62%)]" />
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="relative mx-auto max-w-4xl">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-300">Contact ConsultME</p>
          <h1 className="mt-5 text-5xl font-black tracking-tight sm:text-6xl">We're Here to Help!</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-blue-100">
            Get in touch with our team for inquiries, collaborations, support, or consultation requests.
          </p>
        </motion.div>
      </section>

      <section className="bg-white px-4 py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-stretch">
          <div className="grid gap-5">
            {contactCards.map((card) => {
              const Icon = card.icon
              return (
                <article key={card.title} className="rounded-lg border border-blue-100 bg-blue-50/70 p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-100">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-white text-xl text-blue-700 shadow-sm">
                    <Icon />
                  </div>
                  <h2 className="mt-5 text-xl font-black text-slate-950">{card.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{card.value}</p>
                </article>
              )
            })}
          </div>

          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }} className="rounded-lg border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-200/70 sm:p-8">
            <div className="max-w-2xl">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-600">Message Us</p>
              <h2 className="mt-3 text-3xl font-black text-slate-950">Send Us a Message</h2>
              <p className="mt-3 text-slate-600">Fill out the form below and we'll respond within 24 hours.</p>
            </div>

            {submitted ? (
              <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
                Thanks for reaching out! We'll get back to you within 24 hours.
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-black text-slate-800">
                  Full Name
                  <input required name="name" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 font-semibold outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100" />
                </label>
                <label className="grid gap-2 text-sm font-black text-slate-800">
                  Email Address
                  <input required type="email" name="email" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 font-semibold outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100" />
                </label>
              </div>
              <label className="grid gap-2 text-sm font-black text-slate-800">
                Subject
                <input required name="subject" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 font-semibold outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100" />
              </label>
              <label className="grid gap-2 text-sm font-black text-slate-800">
                Message
                <textarea required name="message" rows="6" className="resize-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 font-semibold outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100" />
              </label>
              <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700">
                Send Message <FaPaperPlane />
              </button>
            </form>
          </motion.div>
        </div>
      </section>

      <section className="bg-slate-950 px-4 py-16 text-white lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 className="text-3xl font-black">Need expert guidance quickly?</h2>
            <p className="mt-3 max-w-2xl text-blue-100">Create an account and start matching with verified consultants across industries.</p>
          </div>
          <Button to="/register">Get Started</Button>
        </div>
      </section>
    </>
  )
}

export default ContactPage
