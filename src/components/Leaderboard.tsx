'use client';

import { useEffect, useState } from 'react';

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  timestamp: string;
}

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const fetchLeaderboard = () => {
      try {
        const storedPlayers = localStorage.getItem('maze_leaderboard') || '[]';
        const players: LeaderboardEntry[] = JSON.parse(storedPlayers);

        const sortedPlayers = players
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);  // ✅ Only top 5!

        setLeaderboard(sortedPlayers);
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
        setLeaderboard([]);
      }
    };

    fetchLeaderboard();

    // Listen for leaderboard updates
    window.addEventListener('leaderboardUpdate', fetchLeaderboard);

    return () => {
      window.removeEventListener('leaderboardUpdate', fetchLeaderboard);
    };
  }, []);

  return (
    <div className="bg-slate-800 rounded-lg shadow-xl p-6 border border-slate-700">
      <h2 className="text-2xl font-bold mb-4 text-white">🏆 Leaderboard</h2>
      <ul className="space-y-2">
        {leaderboard.length === 0 ? (
          <li className="text-slate-400">No scores yet. Be the first!</li>
        ) : (
          leaderboard.map((entry, index) => (
            <li
              key={entry.id}
              className={`flex justify-between text-slate-300 ${index === 0 ? 'text-yellow-400 font-bold' : ''}`}
            >
              <span>{index + 1}. {entry.name}</span>
              <span>{entry.score}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
