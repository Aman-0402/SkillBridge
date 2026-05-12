import { motion } from 'framer-motion'
import {
  FaArrowRight,
  FaBookOpen,
  FaBriefcase,
  FaBuilding,
  FaBuildingColumns,
  FaBullseye,
  FaCamera,
  FaCoins,
  FaEnvelope,
  FaEye,
  FaGlobe,
  FaHeartPulse,
  FaLocationDot,
  FaMicrochip,
  FaPhone,
  FaScaleBalanced,
} from 'react-icons/fa6'
import teamImage from '../../assets/brand/team.jpg'
import Button from '../../components/ui/Button'
import FeatureCard from '../../components/ui/FeatureCard'
import SectionHeader from '../../components/ui/SectionHeader'

const valueCards = [
  {
    title: 'Our Mission',
    description:
      'To simplify access to expert consultancy and mentorship for everyone, empowering individuals and businesses to make informed, strategic, and confident decisions.',
    icon: FaBullseye,
  },
  {
    title: 'Our Vision',
    description:
      "To be India's most trusted platform for professional consultancy and mentorship, connecting industries with the right knowledge and expertise to accelerate growth.",
    icon: FaEye,
  },
]

const whatWeDo = [
  {
    title: 'Business Consulting',
    description: 'Strategic guidance to help your business scale efficiently and achieve measurable results.',
    icon: FaBriefcase,
  },
  {
    title: 'AI & Technology Consulting',
    description: 'Unlock digital transformation with AI integration, data analytics, and automation solutions.',
    icon: FaMicrochip,
  },
  {
    title: 'Finance & Legal Advisory',
    description: 'Comprehensive support for financial planning, compliance, and investment strategies.',
    icon: FaScaleBalanced,
  },
]

const industries = [
  { title: 'Business & Startups', icon: FaBriefcase },
  { title: 'Finance & Banking', icon: FaBuildingColumns },
  { title: 'Technology & AI', icon: FaMicrochip },
  { title: 'Media & Marketing', icon: FaCamera },
  { title: 'Healthcare', icon: FaHeartPulse },
  { title: 'Education & Training', icon: FaBookOpen },
  { title: 'Corporate & Legal', icon: FaBuilding },
  { title: 'Government & NGOs', icon: FaGlobe },
]

const tags = ['Appointment Booking', 'AI Consultant Suggestions', 'Multi-Industry Experts']

function AboutPage() {
  return (
    <>
      <section className="overflow-hidden bg-white px-4 pb-20 pt-28 lg:px-8 lg:pt-32">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1fr_0.9fr]">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-600">About ConsultME</p>
            <h1 className="mt-5 max-w-4xl text-5xl font-black tracking-tight text-slate-950 sm:text-6xl">
              Connect With Verified Experts For Smarter Business Decisions
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              ConsultME is India's smart consultation marketplace helping individuals, startups, and enterprises book experts, post projects, and grow faster with professional guidance.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button to="/services">
                Explore Services <FaArrowRight />
              </Button>
              <Button to="/create-account" variant="secondary">
                Get Free Consultation
              </Button>
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              {tags.map((tag) => (
                <span key={tag} className="rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-black text-blue-800">
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.45, delay: 0.08 }} className="relative">
            <img src={teamImage} alt="ConsultME team consultation" className="aspect-[4/3] w-full rounded-lg object-cover shadow-2xl shadow-blue-100" />
            <div className="absolute -bottom-8 left-6 right-6 rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
              <h2 className="text-xl font-black text-slate-950">Quick Contact</h2>
              <p className="mt-2 text-sm text-slate-600">Connect with our platform team today.</p>
              <div className="mt-5 space-y-3 text-sm font-bold text-slate-700">
                <div className="flex items-center gap-3">
                  <FaEnvelope className="text-blue-600" />
                  support@consultme.in
                </div>
                <div className="flex items-center gap-3">
                  <FaPhone className="text-emerald-600" />
                  +91 8317818107
                </div>
              </div>
              <Button to="/contact" variant="dark" className="mt-5 w-full">
                Contact Now
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-4 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader eyebrow="Mission & Vision" title="Why ConsultME Exists" align="center" />
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {valueCards.map((item) => (
              <FeatureCard key={item.title} {...item} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="What We Do"
            title="Expert-Led Solutions Across Multiple Domains"
            description="ConsultME helps individuals and organizations grow strategically and sustainably through focused advisory, expert matching, and marketplace workflows."
            align="center"
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {whatWeDo.map((item) => (
              <FeatureCard key={item.title} {...item} />
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="Industries We Serve"
            title="Consulting Coverage For Diverse Sectors"
            description="We provide expert consulting services across diverse industries and professional sectors."
            align="center"
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {industries.map((industry) => {
              const Icon = industry.icon
              return (
                <article key={industry.title} className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-blue-50 text-xl text-blue-700">
                    <Icon />
                  </div>
                  <h3 className="mt-4 text-sm font-black text-slate-950">{industry.title}</h3>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-blue-950 px-4 py-16 text-white lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-center">
          <div>
            <h2 className="text-3xl font-black">Ready to Collaborate with Industry Experts?</h2>
            <p className="mt-4 max-w-2xl text-blue-100">
              Join the ConsultME network and get access to top consultants and mentors across industries.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/10 p-6 backdrop-blur">
            <div className="flex items-start gap-4">
              <FaLocationDot className="mt-1 text-xl text-blue-300" />
              <p className="text-sm leading-6 text-blue-50">
                2066 2nd Floor, Nazarbaug Palace, Mandvi, Near Mandvi Gate, Vadodara, Gujarat, India 390001
              </p>
            </div>
            <Button to="/create-account" className="mt-6 w-full">
              Get Started
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}

export default AboutPage
