import { useEffect } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { getGameBySlug } from '../lib/games'

export default function GamePlayer() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const { slug } = useParams()
  const game = getGameBySlug(slug)

  if (!game) {
    return <Navigate to="/games" replace />
  }

  return (
    <Layout mainClassName="flex items-center justify-center p-4">
      <div className={`w-full max-w-[400px] ${game.aspectRatio}`}>
        <iframe
          src={game.src}
          className="w-full h-full border-0 rounded-lg shadow-2xl"
          title={game.title}
        />
      </div>
    </Layout>
  );
}
