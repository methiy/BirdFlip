
import React, { useEffect, useState } from 'react';
import { GameState } from '../types';
import { TARGET_WORD, LEVEL_CONFIGS, COLOR_SUCCESS, COLOR_DANGER } from '../constants';
import { generateFlavorText } from '../services/geminiService';

interface UIOverlayProps {
  gameState: GameState;
  lives: number;
  collectedMask: boolean[];
  setsCollected: number;
  finalProgress: number;
  onRestart: () => void;
}

const HeartIcon: React.FC<{ filled: boolean }> = ({ filled }) => (
  <svg className={`w-8 h-8 ${filled ? 'text-red-500' : 'text-red-900'}`} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
  </svg>
);

const UIOverlay: React.FC<UIOverlayProps> = ({
  gameState,
  lives,
  collectedMask,
  setsCollected,
  finalProgress,
  onRestart
}) => {
  const [flavorText, setFlavorText] = useState<string>("");
  const [loadingFlavor, setLoadingFlavor] = useState(false);
  
  const levelIndex = Math.min(setsCollected, LEVEL_CONFIGS.length - 1);
  const currentLevel = LEVEL_CONFIGS[levelIndex];
  const isBossLevel = currentLevel.isBossLevel;

  const phase = finalProgress <= 25 ? 'CRITICAL (PHASE 3)' : finalProgress <= 50 ? 'ACTIVE (PHASE 2)' : 'IDLE (PHASE 1)';
  const phaseColor = finalProgress <= 25 ? 'text-red-500' : finalProgress <= 50 ? 'text-orange-400' : 'text-slate-400';

  useEffect(() => {
    if (gameState === GameState.GAME_OVER || gameState === GameState.VICTORY) {
      setLoadingFlavor(true);
      generateFlavorText(gameState, setsCollected).then(text => {
        setFlavorText(text);
        setLoadingFlavor(false);
      });
    } else {
      setFlavorText("");
    }
  }, [gameState, setsCollected]);

  if (gameState === GameState.START) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-10 text-white">
        <h1 className="text-6xl font-bold mb-4 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-600">
          GEMINI FLIGHT
        </h1>
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-600 max-w-md text-center">
          <p className="mb-4 text-lg text-slate-300">CAMPAIGN MODE</p>
          <p className="mb-4 text-sm text-slate-400">
            Complete 5 Sectors to reach THE CORE.<br/>
            Collect <span className="text-emerald-400 font-bold">G-E-M-I-N-I</span> to advance.
          </p>
          <button 
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded animate-pulse"
            onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }))}
          >
            LAUNCH CAMPAIGN
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-10">
      
      <div className="flex justify-between items-start w-full">
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
             i < lives && <HeartIcon key={i} filled={true} />
          ))}
        </div>

        <div className="flex flex-col items-center">
           <h3 className="text-lg font-bold text-white bg-slate-900/50 px-4 py-1 rounded border border-slate-700 backdrop-blur-sm">
             SECTOR {levelIndex + 1}: <span className="text-indigo-400">{currentLevel.name}</span>
           </h3>
           <p className="text-[10px] text-slate-400 tracking-widest">{currentLevel.subtitle}</p>
        </div>

        <div className="w-24"></div> 
      </div>

      <div className="flex justify-center mt-2">
        {!isBossLevel ? (
          <div className="flex flex-col items-center bg-slate-900/80 p-2 rounded border border-slate-700">
            <div className="flex gap-2">
              {TARGET_WORD.map((char, index) => (
                <span 
                  key={index} 
                  className={`text-2xl font-bold w-8 h-8 flex items-center justify-center rounded 
                    ${collectedMask[index]
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/50' 
                      : 'bg-slate-800 text-slate-600'
                    }`}
                >
                  {char}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center w-full max-w-md">
            <h2 className="text-red-500 font-bold text-2xl animate-pulse tracking-widest">CORE INTEGRITY</h2>
            <div className="w-full h-4 bg-slate-900 rounded mt-2 border border-red-900 overflow-hidden relative">
               <div className="h-full bg-red-600 transition-all duration-200 ease-out" style={{ width: `${finalProgress}%` }} />
            </div>
            <p className={`text-xs mt-2 font-bold ${phaseColor}`}>THREAT: {phase}</p>
          </div>
        )}
      </div>

      {(gameState === GameState.GAME_OVER || gameState === GameState.VICTORY) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto">
           <div className={`p-8 rounded-lg border-2 max-w-md text-center shadow-2xl 
             ${gameState === GameState.VICTORY ? 'bg-slate-800 border-emerald-500' : 'bg-slate-900 border-red-500'}`}>
             
             <h2 className={`text-4xl font-bold mb-2 ${gameState === GameState.VICTORY ? 'text-emerald-400' : 'text-red-500'}`}>
               {gameState === GameState.VICTORY ? 'CAMPAIGN VICTORY' : 'SIGNAL LOST'}
             </h2>
             
             <div className="my-6 p-4 bg-black/40 rounded border border-slate-700 min-h-[80px] flex items-center justify-center">
               {loadingFlavor ? (
                 <span className="animate-pulse text-slate-500">Analysing flight data...</span>
               ) : (
                 <p className="text-slate-200 italic">"{flavorText}"</p>
               )}
             </div>

             <div className="text-slate-400 mb-6 text-sm">
               REACHED SECTOR: {levelIndex + 1} / 6
             </div>

             <button 
               onClick={onRestart}
               className={`px-8 py-3 text-white font-bold rounded transition-transform hover:scale-105
                 ${gameState === GameState.VICTORY ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'}`}
             >
               RESTART MISSION
             </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default UIOverlay;
