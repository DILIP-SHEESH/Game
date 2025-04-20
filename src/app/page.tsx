import Dashboard from '@/components/Dashboard';
import Game from '@/components/Game';
import Leaderboard from '@/components/Leaderboard';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-800">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center text-white mb-8">
          Dept. of ISE GAME
        </h1>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3">
            <Dashboard />
          </div>
          <div className="lg:col-span-6">
            <Game />
          </div>
          <div className="lg:col-span-3">
            <Leaderboard />
          </div>
        </div>
      </div>
    </main>
  );
}