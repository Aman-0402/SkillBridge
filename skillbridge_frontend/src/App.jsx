import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import PublicLayout from './layouts/PublicLayout'
import DashboardLayout from './layouts/DashboardLayout'

import HomePage from './pages/marketing/HomePage'
import AboutPage from './pages/marketing/AboutPage'
import ServicesPage from './pages/marketing/ServicesPage'
import ContactPage from './pages/marketing/ContactPage'

import Login from './pages/Login'
import Register from './pages/Register'
import RegisterClient from './pages/RegisterClient'
import RegisterFreelancer from './pages/RegisterFreelancer'

import DashboardHome from './pages/dashboard/DashboardHome'
import Profile from './pages/Profile'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import CreateProject from './pages/CreateProject'
import EditProject from './pages/EditProject'
import Jobs from './pages/Jobs'
import JobDetail from './pages/JobDetail'
import PostJob from './pages/PostJob'
import Consultants from './pages/Consultants'
import ConsultantProfile from './pages/ConsultantProfile'
import ManageAvailability from './pages/ManageAvailability'
import Chat from './pages/Chat'
import Payment from './pages/Payment'
import Earnings from './pages/Earnings'
import DashboardStats from './pages/DashboardStats'
import AdminDashboard from './pages/AdminDashboard'
import AdminPanel from './pages/AdminPanel'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public pages + auth — all wrapped with Header + Footer */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register/client" element={<RegisterClient />} />
            <Route path="/register/freelancer" element={<RegisterFreelancer />} />
          </Route>

          {/* Protected dashboard pages wrapped with DashboardLayout */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardHome />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/projects/:id/edit" element={<EditProject />} />
            <Route path="/create-project" element={<CreateProject />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs/:id" element={<JobDetail />} />
            <Route path="/post-job" element={<PostJob />} />
            <Route path="/consultants" element={<Consultants />} />
            <Route path="/consultants/:username" element={<ConsultantProfile />} />
            <Route path="/manage-availability" element={<ManageAvailability />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/payment/:proposalId" element={<Payment />} />
            <Route path="/earnings" element={<Earnings />} />
            <Route path="/stats" element={<DashboardStats />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/panel" element={<AdminPanel />} />
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
