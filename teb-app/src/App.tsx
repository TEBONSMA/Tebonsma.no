import {BrowserRouter as Router, Routes, Route} from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { ProfileProvider } from './account/ProfileProvider'
import Home from './pages/Home'
import About from './pages/About'
import Contact from './pages/Contact'
import FlappyGame from './pages/Flappygame'
import AuthCallback from './pages/AuthCallback'
import Konto from './pages/Konto'
import './App.css'

function App() {

  return (
    <Router>
      <AuthProvider>
        <ProfileProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/flappy" element={<FlappyGame />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/konto" element={<Konto />} />
          </Routes>
        </ProfileProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
