import {
  FaBrain,
  FaBoxOpen,
  FaBriefcase,
  FaCalendarCheck,
  FaChartLine,
  FaCircleCheck,
  FaClipboardList,
  FaEarthAsia,
  FaGraduationCap,
  FaHandshake,
  FaIndianRupeeSign,
  FaLightbulb,
  FaMicrochip,
  FaNetworkWired,
  FaPeopleGroup,
  FaRocket,
  FaUsersGear,
  FaUserTie,
  FaWandMagicSparkles,
} from 'react-icons/fa6'

export const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Services', to: '/services' },
  { label: 'About us', to: '/about' },
  { label: 'Contact us', to: '/contact' },
]

export const stats = [
  { value: '1200+', label: 'Verified Experts' },
  { value: '25+', label: 'Industries' },
  { value: '1000+', label: 'Consultations Completed' },
]

export const solutions = [
  {
    title: 'Precision Guidance',
    description: 'Tailored expert advice aligned with your goals, industry, and growth stage.',
    icon: FaChartLine,
  },
  {
    title: 'End-to-End Consulting',
    description: 'From strategy and planning to execution and optimization handled seamlessly.',
    icon: FaNetworkWired,
  },
  {
    title: 'Elite Expert Network',
    description: 'Access a curated pool of verified professionals across 50+ domains.',
    icon: FaPeopleGroup,
  },
  {
    title: 'Growth Roadmaps',
    description: 'Clear, measurable plans for career acceleration and business scaling.',
    icon: FaLightbulb,
  },
]

export const services = [
  {
    title: 'Appointment Booking',
    description: 'Schedule meetings with verified consultants seamlessly through our easy appointment system.',
    icon: FaCalendarCheck,
  },
  {
    title: 'Project / Task Posting',
    description: 'Post your project requirements and receive proposals from expert consultants instantly.',
    icon: FaClipboardList,
  },
  {
    title: 'Consultant Suggestions',
    description: 'Get AI-driven recommendations to match you with the most suitable industry experts.',
    icon: FaWandMagicSparkles,
  },
  {
    title: 'Affordable Pricing',
    description: 'Transparent and budget-friendly pricing models suitable for startups, MSMEs, and enterprises.',
    icon: FaIndianRupeeSign,
  },
  {
    title: 'One-Click Booking',
    description: 'Confirm and book your consultant instantly with a fast and hassle-free one-click process.',
    icon: FaCircleCheck,
  },
  {
    title: 'Multi Industry Expertise',
    description: 'Access professionals across technology, legal, finance, healthcare, media, and more.',
    icon: FaEarthAsia,
  },
]

export const inHouseServices = [
  {
    title: 'Startup Consultation',
    description: 'Validate ideas, design business models, and launch startups with expert strategic guidance.',
    icon: FaRocket,
  },
  {
    title: 'AI Consultation',
    description: 'Implement AI-driven automation, optimize workflows, and enhance business efficiency.',
    icon: FaMicrochip,
  },
  {
    title: 'Business Consultation',
    description: 'Improve operations, scale growth strategies, and maximize profitability with expert insights.',
    icon: FaBriefcase,
  },
  {
    title: 'Training Consultation',
    description: 'Design structured training programs, institutional frameworks, and learning systems effectively.',
    icon: FaGraduationCap,
  },
  {
    title: 'Product Consultation',
    description: 'Plan, develop, and scale digital products with expert product strategy and roadmap guidance.',
    icon: FaBoxOpen,
  },
  {
    title: 'HR Consultation',
    description: 'Build hiring systems, HR policies, and talent pipelines for sustainable workforce growth.',
    icon: FaUsersGear,
  },
]

export const dashboardMetrics = [
  { label: 'Active Consultants', value: '148', trend: '+12 this week' },
  { label: 'Open Projects', value: '36', trend: '8 closing soon' },
  { label: 'Appointments', value: '24', trend: 'Today and upcoming' },
  { label: 'Satisfaction', value: '98%', trend: 'From completed sessions' },
]

export const featuredConsultants = [
  { name: 'Aarav Mehta', role: 'Business Consultant', expertise: 'Go-to-market, strategy', rating: '4.9' },
  { name: 'Nisha Rao', role: 'AI Consultant', expertise: 'Automation, analytics', rating: '4.8' },
  { name: 'Kunal Shah', role: 'Finance Advisor', expertise: 'Budgeting, fundraising', rating: '4.9' },
]

export const dashboardProjects = [
  { title: 'Market entry strategy for SaaS product', budget: 'Rs. 75,000', status: 'Active' },
  { title: 'AI workflow audit for operations team', budget: 'Rs. 45,000', status: 'Proposal review' },
  { title: 'HR policy and hiring roadmap', budget: 'Rs. 30,000', status: 'Draft' },
]

export const roleOptions = {
  signup: [
    {
      title: 'Solution Seeker',
      description: 'Post projects, book experts, and manage consultations for your business goals.',
      to: '/register',
      icon: FaBriefcase,
    },
    {
      title: 'Freelancer',
      description: 'Join as a consultant, receive project requests, and grow your expert profile.',
      to: '/register',
      icon: FaUserTie,
    },
  ],
  login: [
    {
      title: 'Solution Seeker',
      description: 'Access your dashboard, projects, appointments, and consultant shortlist.',
      to: '/login',
      icon: FaHandshake,
    },
    {
      title: 'Freelancer',
      description: 'Manage profile, requests, appointments, and matching project opportunities.',
      to: '/login',
      icon: FaBrain,
    },
  ],
}
