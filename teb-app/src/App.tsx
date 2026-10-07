import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { ProfileProvider } from './account/ProfileProvider'
import NotificationsProvider from './components/feed/NotificationsProvider'
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
import Mail from './pages/Mail'
import MailAutoReply from './pages/MailAutoReply'
import MailConsent from './pages/MailConsent'
import Medlem from './pages/Medlem'
import InstallApp from './pages/InstallApp'
import './App.css'

function App() {

  return (
    <Router>
      <AuthProvider>
        <ProfileProvider>
          <NotificationsProvider>
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
              <Route path="/app" element={<InstallApp />} />
              <Route path="/medlem" element={<Navigate to="/medlem/meg" replace />} />
              <Route path="/medlem/:id" element={<Medlem />} />
              <Route path="/mail" element={<Mail />} />
              <Route path="/mail/autosvar" element={<MailAutoReply />} />
              <Route path="/mail/tillatelse" element={<MailConsent />} />
              <Route path="/mail/:folder" element={<Mail />} />
              <Route path="/mail/:folder/:id" element={<Mail />} />
            </Routes>
          </NotificationsProvider>
        </ProfileProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
