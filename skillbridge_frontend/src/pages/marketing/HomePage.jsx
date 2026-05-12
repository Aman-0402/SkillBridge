import { motion } from 'framer-motion'
import { FaArrowRight, FaCheck, FaCompass, FaIdBadge, FaRocket } from 'react-icons/fa6'
import solutionImage from '../../assets/brand/solution-1.jpg'
import FeatureCard from '../../components/ui/FeatureCard'
import SectionHeader from '../../components/ui/SectionHeader'
import Button from '../../components/ui/Button'
import { services, solutions, stats } from '../../data'

function HomePage() {
  return (
    <>
      <section className="overflow-hidden bg-white">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex rounded-lg bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-blue-700">
              On-Demand Expert Network for Business & Tech Decisions
            </span>
            <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
              Stop Guessing. Ask an Expert.
            </h1>
            <p className="mt-6 max-w-2xl text-xl font-semibold text-slate-700">
              Get matched with the right expert within 24 hours.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button to="/register">
                Get Started <FaArrowRight />
              </Button>
              <Button to="/login" variant="secondary">
                Browse Experts
              </Button>
            </div>
            <p className="mt-5 text-sm font-semibold text-slate-500">No commitment • Fast matching • Confidential discussions</p>
            <div className="mt-8 grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
              {stats.map((item) => (
                <div key={item.label}>
                  <strong className="block text-2xl font-black text-blue-700">{item.value}</strong>
                  <span className="text-xs font-bold text-slate-500">{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }} className="relative">
            <img src={solutionImage} alt="ConsultME expert consultation" className="aspect-[4/3] w-full rounded-lg object-cover shadow-2xl shadow-slate-300" />
            <div className="absolute -bottom-6 left-6 right-6 rounded-lg border border-slate-200 bg-white p-5 shadow-xl">
              <h2 className="text-lg font-black text-slate-950">How It Works</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {['Tell us your problem', 'Get matched with experts', 'Consult and validate strategy', 'Execute with clarity'].map((step, index) => (
                  <div key={step} className="flex items-center gap-3 text-sm font-bold text-slate-700">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-xs text-blue-700">0{index + 1}</span>
                    {step}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-4 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="Our Solutions"
            title="Expertise That Translates Into Real Results"
            description="ConsultME delivers expert-led solutions designed to help individuals, startups, and enterprises make better decisions and move faster."
          />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {solutions.map((item) => (
              <FeatureCard key={item.title} {...item} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader eyebrow="Our Services" title="Connect Clients & Consultants" align="center" />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((item) => (
              <FeatureCard key={item.title} {...item} />
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button to="/services">Explore All Services</Button>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionHeader
              eyebrow="Our Philosophy"
              title="Building Meaningful Connections Between Vision & Expertise"
              description="At ConsultME, access to the right expert at the right time transforms uncertainty into structured growth."
            />
            <div className="mt-8 rounded-lg border-l-4 border-blue-600 bg-white p-6 text-slate-600 shadow-sm">
              We empower individuals, startups, and enterprises by connecting them with verified consultants who convert clarity into action.
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {[
              ['Clarity Before Complexity', 'We simplify complex challenges into structured insights.', FaCompass],
              ['Experience-Led Guidance', 'Practical, results-driven advice from real execution experience.', FaIdBadge],
              ['Outcome-Focused Growth', 'Impact measured through stronger decisions and sustainable growth.', FaRocket],
            ].map(([title, description, Icon]) => (
              <article key={title} className="rounded-lg bg-white p-6 shadow-sm">
                <Icon className="text-2xl text-blue-600" />
                <h3 className="mt-5 font-black text-slate-950">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-4 py-16 text-white lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 md:flex-row md:items-center">
          <div>
            <h2 className="text-3xl font-black">Need consulting services?</h2>
            <p className="mt-3 max-w-2xl text-slate-300">Get instant access to verified experts across industries. Your consultation starts without delay, reliable, and tailored to your needs.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button to="/register">Register</Button>
            <Button to="/contact" variant="secondary">
              <FaCheck /> Contact Us
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}

export default HomePage
