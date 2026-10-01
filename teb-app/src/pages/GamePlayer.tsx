import { useEffect, useRef } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../auth/AuthContext'
import { getGameBySlug } from '../lib/games'
import { getLeaderboard, startRun, submitScore, type Leaderboard } from '../lib/scoreboard'

type ScoreboardMessage =
  | { state: 'saving' | 'login' }
  | { state: 'error'; error: string }
  | { state: 'board'; board: Leaderboard; newBest: boolean }

export default function GamePlayer() {
  const { slug } = useParams()
  const game = getGameBySlug(slug)
  const gameSlug = game?.slug
  const { user, login } = useAuth()
  const token = user?.access_token
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const tokenRef = useRef(token)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    tokenRef.current = token
  }, [token])

  // The game (in the iframe) reports when a run starts and ends. Logged-in members' scores
  // go to the API, and the scoreboard is sent back for the game-over screen.
  useEffect(() => {
    if (!gameSlug) return

    // The run in progress. runNumber goes up whenever a run starts or this game is left, so
    // an answer that arrives late can tell that it no longer belongs on the screen.
    let ticket: Promise<string> | null = null
    let runOpen = false
    let runNumber = 0

    const frame = () => iframeRef.current?.contentWindow
    const send = (message: ScoreboardMessage) =>
      frame()?.postMessage({ type: 'game:scoreboard', ...message }, window.location.origin)

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame()) return
      const data = event.data as { type?: unknown; score?: unknown; silent?: unknown }
      const current = tokenRef.current

      if (data.type === 'game:login') {
        login()
      } else if (data.type === 'game:start') {
        runNumber++
        runOpen = true
        ticket = current ? startRun(current, gameSlug) : null
        ticket?.catch(() => {}) // Reported when the score is submitted
      } else if (data.type === 'game:gameover' && typeof data.score === 'number') {
        // A run ends once; a repeated game-over for the same run is ignored
        if (!runOpen) return
        runOpen = false
        const run = ticket
        ticket = null
        const score = data.score

        // A silent end is a run that was restarted, so there is no game-over screen to update
        if (data.silent === true) {
          if (current && run && score > 0) {
            run.then(runId => submitScore(current, gameSlug, runId, score)).catch(() => {})
          }
          return
        }
        if (!current) {
          send({ state: 'login' })
          return
        }
        send({ state: 'saving' })
        const endedRun = runNumber
        const sendIfCurrent = (message: ScoreboardMessage) => {
          if (runNumber === endedRun) send(message)
        }
        const saved =
          run && score > 0
            ? run.then(runId => submitScore(current, gameSlug, runId, score))
            : getLeaderboard(current, gameSlug).then(board => ({ newBest: false, leaderboard: board }))
        saved
          .then(result => sendIfCurrent({ state: 'board', board: result.leaderboard, newBest: result.newBest }))
          .catch(err => sendIfCurrent({ state: 'error', error: `Resultatet ble ikke lagret: ${err.message}` }))
      }
    }
    window.addEventListener('message', onMessage)
    return () => {
      window.removeEventListener('message', onMessage)
      runNumber++ // Answers still on their way belong to a game that is no longer open
    }
  }, [gameSlug, login])

  if (!game) {
    return <Navigate to="/games" replace />
  }

  return (
    <Layout mainClassName="flex items-center justify-center p-4">
      <div className={`w-full max-w-[400px] ${game.aspectRatio}`}>
        <iframe
          key={game.slug}
          ref={iframeRef}
          src={game.src}
          className="w-full h-full border-0 rounded-lg shadow-2xl"
          title={game.title}
        />
      </div>
    </Layout>
  );
}
