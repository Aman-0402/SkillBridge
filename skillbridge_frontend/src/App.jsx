import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

function Home() {
  return (
    <div className="flex items-center justify-center h-screen">
      <h1 className="text-4xl font-bold">Welcome to SkillBridge</h1>
    </div>
  )
}

export default App
