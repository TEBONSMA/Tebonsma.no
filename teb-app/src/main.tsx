import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './globals.css'
import App from './App.tsx'
import { userManager } from './auth/userManager'

// A silent login (see AuthProvider) answers on /auth/callback inside a hidden frame. That frame
// only hands the answer to the page and never starts the site itself.
if (window.parent !== window && window.location.pathname === '/auth/callback') {
  void userManager.signinSilentCallback()
} else {
  // Shows push notifications (public/sw.js)
  if ('serviceWorker' in navigator) void navigator.serviceWorker.register('/sw.js')
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
