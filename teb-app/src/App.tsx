import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { ProfileProvider } from './account/ProfileProvider'
import Home from './pages/Home'
import About from './pages/About'
import Contact from './pages/Contact'
import Games from './pages/Games'
import GamePlayer from './pages/GamePlayer'
import AuthCallback from './pages/AuthCallback'
import Konto from './pages/Konto'
import Feed from './pages/Feed'
import FeedPost from './pages/FeedPost'
import Kalender from './pages/Kalender'
import Medlem from './pages/Medlem'
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
            <Route path="/games" element={<Games />} />
            <Route path="/games/:slug" element={<GamePlayer />} />
            <Route path="/flappy" element={<Navigate to="/games/flappy-teb" replace />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/konto" element={<Konto />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/feed/:id" element={<FeedPost />} />
            <Route path="/kalender" element={<Kalender />} />
            <Route path="/medlem" element={<Navigate to="/medlem/meg" replace />} />
            <Route path="/medlem/:id" element={<Medlem />} />
          </Routes>
        </ProfileProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
