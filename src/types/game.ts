export interface Player {
    id: string;
    name: string;
    score: number;
    timestamp: Date;
  }
  
  export interface GameState {
    currentScore: number;
    isPlaying: boolean;
    playerName: string;
    lives: number;
    gameSpeed: number;
  }
  
  export interface GameObject {
    x: number;
    y: number;
    width: number;
    height: number;
    speed: number;
  }