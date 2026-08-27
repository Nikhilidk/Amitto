import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Register from './pages/Register.jsx'
import Login from './pages/Login.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/" element={<Login />} />
      </Routes>
    </div>
  )
}

export default App