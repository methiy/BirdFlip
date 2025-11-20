
import React, { useState } from 'react';
import GameCanvas from './components/GameCanvas';
import UIOverlay from './components/UIOverlay';
import { GameState } from './types';
import { TARGET_WORD } from './constants';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [lives, setLives] = useState(3);
  const [collectedMask, setCollectedMask] = useState<boolean[]>(new Array(TARGET_WORD.length).fill(false));
  // setsCollected now acts as the Level Index (0 = Level 1, 5 = Level 6)
  const [setsCollected, setSetsCollected] = useState(0);
  const [finalProgress, setFinalProgress] = useState(0);

  const handleRestart = () => {
    setGameState(GameState.START);
  };

  return (
    <div className="flex items-center justify-center w-full h-screen bg-slate-950 p-4 select-none overflow-hidden">
      <div className="relative w-full max-w-[800px] aspect-[4/3]">
        <GameCanvas 
          gameState={gameState}
          setGameState={setGameState}
          lives={lives}
          setLives={setLives}
          collectedMask={collectedMask}
          setCollectedMask={setCollectedMask}
          setsCollected={setsCollected}
          setSetsCollected={setSetsCollected}
          setFinalProgress={setFinalProgress}
        />
        <UIOverlay 
          gameState={gameState}
          lives={lives}
          collectedMask={collectedMask}
          setsCollected={setsCollected}
          finalProgress={finalProgress}
          onRestart={handleRestart}
        />
      </div>
    </div>
  );
};

export default App;
