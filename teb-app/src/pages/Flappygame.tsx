import { useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../auth/AuthContext';
import { getLeaderboard, startRun, submitScore, type Leaderboard } from '../lib/flappy';

type ScoreboardMessage =
  | { state: 'saving' | 'login' }
  | { state: 'error'; error: string }
  | { state: 'board'; board: Leaderboard; newBest: boolean };

export default function FlappyGame() {
  const { user, login } = useAuth();
  const token = user?.access_token;
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const tokenRef = useRef(token);
  const runRef = useRef<Promise<string> | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}, []);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  // The game (in the iframe) reports when a run starts and ends. Logged-in members' scores
  // go to the API, and the scoreboard is sent back for the game-over screen.
  useEffect(() => {
    const game = () => iframeRef.current?.contentWindow;
    const send = (message: ScoreboardMessage) =>
      game()?.postMessage({ type: 'flappy:scoreboard', ...message }, window.location.origin);

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== game()) return;
      const data = event.data as { type?: unknown; score?: unknown };
      const current = tokenRef.current;

      if (data.type === 'flappy:login') {
        login();
      } else if (data.type === 'flappy:start') {
        runRef.current = current ? startRun(current) : null;
        runRef.current?.catch(() => {}); // Reported when the score is submitted
      } else if (data.type === 'flappy:gameover' && typeof data.score === 'number') {
        const run = runRef.current;
        runRef.current = null;
        if (!current) {
          send({ state: 'login' });
          return;
        }
        const score = data.score;
        send({ state: 'saving' });
        const saved =
          run && score > 0
            ? run.then(runId => submitScore(current, runId, score))
            : getLeaderboard(current).then(board => ({ newBest: false, leaderboard: board }));
        saved
          .then(result => send({ state: 'board', board: result.leaderboard, newBest: result.newBest }))
          .catch(err => send({ state: 'error', error: `Resultatet ble ikke lagret: ${err.message}` }));
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [login]);

  return (
    <Layout mainClassName="flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] aspect-[2/3]">
        <iframe
          ref={iframeRef}
          src="/games/flappy-teb/index.html"
          className="w-full h-full border-0 rounded-lg shadow-2xl"
          title="Flappy TEBONSMA Game"
        />
      </div>
    </Layout>
  );
}
