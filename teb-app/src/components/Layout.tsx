import type { ReactNode } from 'react'
import Header from './Header'
import Footer from './Footer'

interface LayoutProps {
  children: ReactNode
  mainClassName?: string
}

const Layout = ({ children, mainClassName = '' }: LayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen relative">
      <div className="fixed inset-0 z-0 bg-neutral-950 pointer-events-none">
        {/* Dot grid, fading toward the edges */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.14) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)',
          }}
        />
      </div>

      {/* Soft accent glow behind the hero — scrolls away with the page instead of
          staying pinned to the viewport top, so it doesn't bleed into later sections */}
      <div
        className="absolute top-0 inset-x-0 h-[640px] z-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 0%, rgba(255,81,0,0.10), transparent 55%), radial-gradient(circle at 100% 20%, rgba(0,163,79,0.06), transparent 50%)',
        }}
      />

      <Header />

      <main className={`flex-1 relative z-10 ${mainClassName}`}>{children}</main>

      <Footer />
    </div>
  )
}

export default Layout
