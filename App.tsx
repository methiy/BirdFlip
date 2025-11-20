
import React, { useState } from 'react';
import GameCanvas from './components/GameCanvas';
import UIOverlay from './components/UIOverlay';
import { GameState, LevelPhase } from './types';
import { TARGET_WORD } from './constants';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [levelPhase, setLevelPhase] = useState<LevelPhase>('COLLECTING');
  const [lives, setLives] = useState(3);
  const [collectedMask, setCollectedMask] = useState<boolean[]>(new Array(TARGET_WORD.length).fill(false));
  // setsCollected now acts as the Level Index (0 = Level 1, 5 = Level 6)
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [bossHealthPercent, setBossHealthPercent] = useState(100);

  const handleRestart = () => {
    setGameState(GameState.START);
    // Don't reset level index here, user chooses in menu
  };
  
  const handleLevelSelect = (levelIndex: number) => {
    setCurrentLevelIndex(levelIndex);
    setGameState(GameState.PLAYING);
    setLevelPhase('COLLECTING');
    setLives(3);
    setCollectedMask(new Array(TARGET_WORD.length).fill(false));
    setBossHealthPercent(100);
  };

  return (
    <div className="flex items-center justify-center w-full h-screen bg-slate-950 p-4 select-none overflow-hidden">
      <div className="relative w-full max-w-[800px] aspect-[4/3]">
        <GameCanvas 
          gameState={gameState}
          setGameState={setGameState}
          levelPhase={levelPhase}
          setLevelPhase={setLevelPhase}
          lives={lives}
          setLives={setLives}
          collectedMask={collectedMask}
          setCollectedMask={setCollectedMask}
          currentLevelIndex={currentLevelIndex}
          setCurrentLevelIndex={setCurrentLevelIndex}
          setBossHealthPercent={setBossHealthPercent}
        />
        <UIOverlay 
          gameState={gameState}
          levelPhase={levelPhase}
          lives={lives}
          collectedMask={collectedMask}
          currentLevelIndex={currentLevelIndex}
          bossHealthPercent={bossHealthPercent}
          onRestart={handleRestart}
          onSelectLevel={handleLevelSelect}
        />
      </div>
    </div>
  );
};

export default App;
