import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Register from './pages/Register.jsx'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Register />} />
      </Routes>
    </div>
  )
}

export default App