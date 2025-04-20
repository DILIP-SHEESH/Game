'use client';

import { useState, useEffect } from 'react';
import { Player } from '@/types/game';

const LEADERBOARD_KEY = 'maze_leaderboard';

export default function Dashboard() {
  const [totalGamesPlayed, setTotalGamesPlayed] = useState(0);
  const [highestScore, setHighestScore] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);

  useEffect(() => {
    const updateStats = () => {
      // Fetch stored leaderboard entries
      const raw = localStorage.getItem(LEADERBOARD_KEY) || '[]';
      let data: Player[];
      try {
        data = JSON.parse(raw);
      } catch {
        data = [];
      }

      // Total games played
      setTotalGamesPlayed(data.length);

      // Highest score
      const maxScore = data.reduce((max, p) => Math.max(max, p.score), 0);
      setHighestScore(maxScore);

      // Compute best daily streak
      const dates = Array.from(
        new Set(
          data.map(p => new Date(p.timestamp).toDateString())
        )
      ).sort((a, b) => new Date(a).valueOf() - new Date(b).valueOf());

      let bestStreak = 0;
      let streak = 0;

      for (let i = 0; i < dates.length; i++) {
        if (i === 0) {
          streak = 1;
        } else {
          const prev = new Date(dates[i - 1]);
          const curr = new Date(dates[i]);
          const diff = (curr.valueOf() - prev.valueOf()) / (1000 * 60 * 60 * 24);
          if (diff === 1) {
            streak += 1;
          } else {
            streak = 1;
          }
        }
        bestStreak = Math.max(bestStreak, streak);
      }
      setCurrentStreak(bestStreak);
    };

    updateStats();
    // Listen for leaderboard changes
    window.addEventListener('leaderboardUpdate', updateStats);
    return () => window.removeEventListener('leaderboardUpdate', updateStats);
  }, []);

  return (
    <div className="bg-slate-800 rounded-lg shadow-xl p-6 border border-slate-700 transform transition-all hover:scale-102">
      <h2 className="text-2xl font-bold mb-6 text-white flex items-center">
        <span className="text-blue-400 mr-2">📊</span>
        Player Stats
      </h2>
      <div className="space-y-4">
        <div className="bg-slate-700 p-5 rounded-lg transform transition-all hover:bg-slate-600 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1">Games Played</p>
              <p className="text-3xl font-bold text-white">{totalGamesPlayed}</p>
            </div>
            <div className="text-blue-400 text-2xl">🎮</div>
          </div>
        </div>

        <div className="bg-slate-700 p-5 rounded-lg transform transition-all hover:bg-slate-600 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1">High Score</p>
              <p className="text-3xl font-bold text-white">{highestScore}</p>
            </div>
            <div className="text-yellow-400 text-2xl">🏆</div>
          </div>
        </div>

        <div className="bg-slate-700 p-5 rounded-lg transform transition-all hover:bg-slate-600 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1">Best Daily Streak</p>
              <p className="text-3xl font-bold text-white">{currentStreak}</p>
            </div>
            <div className="text-red-400 text-2xl">🔥</div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-slate-600">
        <p className="text-slate-400 text-sm text-center">
          Keep playing to improve your stats!
        </p>
      </div>
    </div>
  );
}
