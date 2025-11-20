
import React, { useEffect, useState } from 'react';
import { GameState, LevelPhase } from '../types';
import { TARGET_WORD, LEVEL_CONFIGS } from '../constants';
import { generateFlavorText } from '../services/geminiService';

interface UIOverlayProps {
  gameState: GameState;
  levelPhase: LevelPhase;
  lives: number;
  collectedMask: boolean[];
  currentLevelIndex: number;
  bossHealthPercent: number;
  onRestart: () => void;
  onSelectLevel: (index: number) => void;
}

const HeartIcon: React.FC<{ filled: boolean }> = ({ filled }) => (
  <svg className={`w-8 h-8 ${filled ? 'text-red-500' : 'text-red-900'}`} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
  </svg>
);

const UIOverlay: React.FC<UIOverlayProps> = ({
  gameState,
  levelPhase,
  lives,
  collectedMask,
  currentLevelIndex,
  bossHealthPercent,
  onRestart,
  onSelectLevel
}) => {
  const [flavorText, setFlavorText] = useState<string>("");
  const [loadingFlavor, setLoadingFlavor] = useState(false);
  
  const levelIndex = Math.min(currentLevelIndex, LEVEL_CONFIGS.length - 1);
  const currentLevel = LEVEL_CONFIGS[levelIndex];

  useEffect(() => {
    if (gameState === GameState.GAME_OVER || gameState === GameState.VICTORY) {
      setLoadingFlavor(true);
      generateFlavorText(gameState, currentLevelIndex).then(text => {
        setFlavorText(text);
        setLoadingFlavor(false);
      });
    } else {
      setFlavorText("");
    }
  }, [gameState, currentLevelIndex]);

  if (gameState === GameState.START) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 z-10 text-white p-6">
        <h1 className="text-5xl font-bold mb-6 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-600">
          GEMINI FLIGHT
        </h1>
        <p className="text-slate-400 mb-8 tracking-widest text-sm">SELECT MISSION SECTOR</p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-3xl">
          {LEVEL_CONFIGS.map((level, idx) => (
             <button
               key={level.id}
               onClick={() => onSelectLevel(idx)}
               className="group relative overflow-hidden rounded-lg border border-slate-700 bg-slate-900 p-4 text-left transition-all hover:border-white hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-indigo-500"
             >
               <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity" 
                    style={{ background: `linear-gradient(to bottom right, ${level.bgColorTop}, ${level.bgColorBottom})` }} 
               />
               <div className="relative z-10">
                 <div className="text-xs font-mono text-slate-500 mb-1">SECTOR 0{level.id}</div>
                 <div className="font-bold text-lg text-white mb-1 group-hover:text-indigo-300">{level.name}</div>
                 <div className="text-[10px] uppercase tracking-wider text-slate-400">
                    Target: <span style={{ color: level.bossConfig.color }}>{level.bossConfig.name}</span>
                 </div>
               </div>
             </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-10">
      
      {/* HUD TOP */}
      <div className="flex justify-between items-start w-full">
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
             i < lives && <HeartIcon key={i} filled={true} />
          ))}
        </div>

        <div className="flex flex-col items-center">
           <h3 className="text-lg font-bold text-white bg-slate-900/50 px-4 py-1 rounded border border-slate-700 backdrop-blur-sm">
             LEVEL {levelIndex + 1}: <span className="text-indigo-400">{currentLevel.name}</span>
           </h3>
           <p className="text-[10px] text-slate-400 tracking-widest">{currentLevel.subtitle}</p>
        </div>

        <div className="w-24 text-right text-xs text-slate-500 font-mono">
          PHASE: <span className={levelPhase === 'BOSS_FIGHT' ? 'text-red-500 font-bold' : 'text-emerald-500'}>{levelPhase}</span>
        </div> 
      </div>

      {/* HUD CENTER */}
      <div className="flex justify-center mt-4">
        {levelPhase === 'COLLECTING' ? (
          <div className="flex flex-col items-center bg-slate-900/80 p-2 rounded border border-slate-700 transition-all">
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
            <p className="text-[10px] text-slate-400 mt-1">COLLECT TO SUMMON BOSS</p>
          </div>
        ) : (
          <div className="flex flex-col items-center w-full max-w-md animate-in fade-in zoom-in duration-300">
            <h2 className="text-red-500 font-bold text-2xl animate-pulse tracking-widest uppercase">
              WARNING: {currentLevel.bossConfig.name}
            </h2>
            <div className="w-full h-6 bg-slate-900 rounded mt-2 border-2 border-red-900 overflow-hidden relative shadow-lg shadow-red-900/50">
               <div className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-200 ease-out" style={{ width: `${bossHealthPercent}%` }} />
            </div>
            {currentLevel.bossConfig.behavior === 'PHASED' && (
               <div className="text-xs text-red-400 mt-1 animate-pulse font-mono">
                 THREAT LEVEL: {bossHealthPercent > 50 ? 'NORMAL' : bossHealthPercent > 25 ? 'ELEVATED' : 'CRITICAL'}
               </div>
            )}
          </div>
        )}
      </div>

      {/* END SCREEN */}
      {(gameState === GameState.GAME_OVER || gameState === GameState.VICTORY) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto">
           <div className={`p-8 rounded-lg border-2 max-w-md text-center shadow-2xl 
             ${gameState === GameState.VICTORY ? 'bg-slate-800 border-emerald-500' : 'bg-slate-900 border-red-500'}`}>
             
             <h2 className={`text-4xl font-bold mb-2 ${gameState === GameState.VICTORY ? 'text-emerald-400' : 'text-red-500'}`}>
               {gameState === GameState.VICTORY ? 'MISSION ACCOMPLISHED' : 'MIA'}
             </h2>
             
             <div className="my-6 p-4 bg-black/40 rounded border border-slate-700 min-h-[80px] flex items-center justify-center">
               {loadingFlavor ? (
                 <span className="animate-pulse text-slate-500">Decrypting transmission...</span>
               ) : (
                 <p className="text-slate-200 italic">"{flavorText}"</p>
               )}
             </div>

             <div className="text-slate-400 mb-6 text-sm">
               SECTOR REACHED: {levelIndex + 1} / {LEVEL_CONFIGS.length}
             </div>

             <button 
               onClick={onRestart}
               className={`px-8 py-3 text-white font-bold rounded transition-transform hover:scale-105
                 ${gameState === GameState.VICTORY ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'}`}
             >
               RETURN TO BASE
             </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default UIOverlay;
