import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import Badge from '../components/Badge'
import SpotlightCard from '../components/reactbits/SpotlightCard'
import { games } from '../lib/games'

export default function Games() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <Layout mainClassName="flex flex-col items-center p-8 pt-24">
      <div className="flex flex-col items-center gap-4 mb-12 text-center">
        <Badge>Spill</Badge>
        <h1 className="text-4xl md:text-6xl font-bold text-teb-orange tracking-tight">
          Spill
        </h1>
        <p className="text-white/70 max-w-xl">
          Her finner du alle spillene vi har laget. Velg et spill og kos deg!
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
        {games.map((game) => (
          <Link key={game.slug} to={`/games/${game.slug}`} className="block">
            <SpotlightCard className="h-full flex flex-col gap-4 transition-transform hover:-translate-y-1">
              <div className="w-full aspect-video rounded-lg overflow-hidden bg-black/20">
                <img
                  src={game.thumbnail}
                  alt={game.title}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white/90">{game.title}</h2>
                <p className="text-white/60 text-sm mt-1">{game.description}</p>
              </div>
            </SpotlightCard>
          </Link>
        ))}
      </div>
    </Layout>
  )
}
