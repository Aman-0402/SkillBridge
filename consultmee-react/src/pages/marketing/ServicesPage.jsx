import { motion } from 'framer-motion'
import {
  FaArrowRight,
  FaCalendarCheck,
  FaCircleCheck,
  FaClipboardList,
  FaHeadset,
  FaShieldHalved,
  FaUserCheck,
} from 'react-icons/fa6'
import businessImage from '../../assets/brand/business-consultant.jpg'
import techImage from '../../assets/brand/tech-consultation.jpg'
import Button from '../../components/ui/Button'
import FeatureCard from '../../components/ui/FeatureCard'
import SectionHeader from '../../components/ui/SectionHeader'
import { inHouseServices, services } from '../../data'

const flowSteps = [
  {
    title: 'Share your requirement',
    description: 'Post a consultation need, business problem, or project brief.',
    icon: FaClipboardList,
  },
  {
    title: 'Get expert matches',
    description: 'Review relevant consultants across business, AI, finance, HR, legal, and more.',
    icon: FaUserCheck,
  },
  {
    title: 'Book and execute',
    description: 'Schedule sessions, manage projects, and move forward with clarity.',
    icon: FaCalendarCheck,
  },
]

const trustPoints = [
  'Verified consultant network',
  'Fast appointment and project workflows',
  'Flexible services for startups, MSMEs, and enterprises',
]

function ServicesPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-slate-950 px-4 pb-20 pt-28 text-white lg:px-8 lg:pb-24 lg:pt-32">
        <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.45),transparent_62%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1fr_0.88fr]">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-300">ConsultME Services</p>
            <h1 className="mt-5 max-w-4xl text-5xl font-black tracking-tight sm:text-6xl">
              Expert consulting and marketplace tools built for faster decisions.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-50">
              Explore ConsultME's range of consultancy, mentorship, and advisory services across business, technology, AI, HR, product, and multi-industry expert networks.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button to="/contact">
                Request Consultation <FaArrowRight />
              </Button>
              <Button to="/create-account" variant="secondary">
                Explore All Services
              </Button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.45, delay: 0.08 }} className="grid gap-4 sm:grid-cols-2">
            <img src={businessImage} alt="Business consultation" className="h-72 w-full rounded-lg object-cover shadow-2xl shadow-blue-950/30 sm:mt-10" />
            <img src={techImage} alt="Technology consultation" className="h-72 w-full rounded-lg object-cover shadow-2xl shadow-blue-950/30" />
            <div className="rounded-lg border border-white/10 bg-white/10 p-5 backdrop-blur sm:col-span-2">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-500 text-white">
                  <FaHeadset />
                </span>
                <div>
                  <p className="text-sm font-black">On-demand expert access</p>
                  <p className="text-sm text-blue-100">Consult, validate, and execute with confidence.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-4 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="In-House Services"
            title="Expert Consulting Delivered Directly By Our Team"
            description="Focused consulting services for businesses that need strategy, systems, product direction, talent planning, and practical execution support."
            align="center"
          />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {inHouseServices.map((service) => (
              <FeatureCard key={service.title} {...service} />
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button to="/contact">Request Consultation</Button>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="Our Services"
            title="Smart Solutions To Connect Clients, Vendors & Consultants"
            description="Tools and workflows adapted from the old platform experience, redesigned for a modern React marketplace frontend."
            align="center"
          />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <FeatureCard key={service.title} {...service} />
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg bg-blue-950 p-8 text-white shadow-2xl shadow-blue-200">
            <FaShieldHalved className="text-3xl text-blue-300" />
            <h2 className="mt-6 text-3xl font-black">Built for trusted consulting workflows</h2>
            <p className="mt-4 text-blue-100">
              ConsultME connects clients and experts through booking, posting, recommendations, and flexible pricing flows.
            </p>
            <div className="mt-8 space-y-4">
              {trustPoints.map((point) => (
                <div key={point} className="flex items-center gap-3 text-sm font-bold text-blue-50">
                  <FaCircleCheck className="text-blue-300" />
                  {point}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-5">
            {flowSteps.map((step, index) => {
              const Icon = step.icon
              return (
                <article key={step.title} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-xl text-blue-700">
                      <Icon />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Step 0{index + 1}</p>
                      <h3 className="mt-2 text-xl font-black text-slate-950">{step.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-4 py-16 text-center text-white lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-black">Need Expert Guidance?</h2>
          <p className="mt-4 text-blue-100">Join clients who trust ConsultME to connect with the right consultants across industries.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button to="/create-account">Register</Button>
            <Button to="/contact" variant="secondary">
              Contact Us
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}

export default ServicesPage
