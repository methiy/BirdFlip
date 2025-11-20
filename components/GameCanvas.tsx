
import React, { useRef, useEffect, useCallback } from 'react';
import { GameState, LevelPhase, Bird, Pipe, FloatingLetter, Particle, PowerUp, Star, Boss, Projectile, PowerUpType, ProjectileType } from '../types';
import { 
  GRAVITY, JUMP_STRENGTH, PIPE_WIDTH, BIRD_X, TARGET_WORD, 
  LEVEL_CONFIGS,
  COLOR_SUCCESS, COLOR_DANGER, COLOR_SHIELD, COLOR_AMMO, COLOR_BOSS,
  COLOR_SPLIT, COLOR_LASER, COLOR_BOOMERANG, COLOR_ENEMY_BOLT,
  PIPE_MOVE_AMPLITUDE, PIPE_MOVE_SPEED, POWERUP_SPAWN_CHANCE,
  PROJECTILE_SPEED_STANDARD, PROJECTILE_SPEED_LASER, PROJECTILE_SPEED_BOOMERANG, PROJECTILE_SPEED_ENEMY
} from '../constants';

interface GameCanvasProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  levelPhase: LevelPhase;
  setLevelPhase: (phase: LevelPhase) => void;
  lives: number;
  setLives: (fn: (prev: number) => number) => void;
  collectedMask: boolean[];
  setCollectedMask: (fn: (prev: boolean[]) => boolean[]) => void;
  currentLevelIndex: number;
  setCurrentLevelIndex: (fn: (prev: number) => number) => void;
  setBossHealthPercent: (val: number) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState,
  setGameState,
  levelPhase,
  setLevelPhase,
  lives,
  setLives,
  collectedMask,
  setCollectedMask,
  currentLevelIndex,
  setCurrentLevelIndex,
  setBossHealthPercent
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const frameCountRef = useRef(0);
  const invulnerableRef = useRef(0); 
  const warpRef = useRef(0); 
  
  const birdRef = useRef<Bird>({ x: BIRD_X, y: 300, velocity: 0, radius: 20, rotation: 0, hasShield: false });
  const pipesRef = useRef<Pipe[]>([]);
  const lettersRef = useRef<FloatingLetter[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<Star[]>([]);
  
  const bossRef = useRef<Boss>({ 
    x: 0, y: 0, width: 100, height: 100, 
    health: 100, maxHealth: 100, 
    oscillationOffset: 0, isHit: 0, attackTimer: 0, phase: 1
  });
  const projectilesRef = useRef<Projectile[]>([]);

  // Safe level config access
  const safeLevelIndex = Math.min(currentLevelIndex, LEVEL_CONFIGS.length - 1);
  const currentLevel = LEVEL_CONFIGS[safeLevelIndex];

  const createExplosion = (x: number, y: number, color: string, count: number = 15) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        id: Math.random().toString(),
        x,
        y,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        life: 30 + Math.random() * 20,
        color
      });
    }
  };

  const initStars = (width: number, height: number) => {
    const stars: Star[] = [];
    for(let i=0; i<100; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 1,
        speed: Math.random() * 3 + 0.5,
        brightness: Math.random()
      });
    }
    starsRef.current = stars;
  };

  // --- BOSS INITIALIZATION ---
  const spawnBoss = (width: number, height: number) => {
    const config = currentLevel.bossConfig;
    bossRef.current = {
      x: width + 100, // Start off-screen right
      y: height / 2,
      width: config.width,
      height: config.height,
      health: config.hp,
      maxHealth: config.hp,
      oscillationOffset: 0,
      isHit: 0,
      attackTimer: 0,
      phase: 1
    };
  };

  const resetGame = useCallback(() => {
    birdRef.current = { x: BIRD_X, y: 300, velocity: 0, radius: 18, rotation: 0, hasShield: false };
    pipesRef.current = [];
    lettersRef.current = [];
    powerUpsRef.current = [];
    particlesRef.current = [];
    projectilesRef.current = [];
    
    frameCountRef.current = 0;
    invulnerableRef.current = 0;
    warpRef.current = 0;
    
    setCollectedMask(() => new Array(TARGET_WORD.length).fill(false));
    // Removed setCurrentLevelIndex(0) to allow level selection from UI
    setLevelPhase('COLLECTING');
    setLives(() => 3);
    setBossHealthPercent(100);
    
    if (canvasRef.current) {
      initStars(canvasRef.current.width, canvasRef.current.height);
    }
  }, [setCollectedMask, setLives, setLevelPhase, setBossHealthPercent]);

  useEffect(() => {
    if (gameState === GameState.START) resetGame();
  }, [gameState, resetGame]);

  // --- LEVEL TRANSITION ---
  useEffect(() => {
     // Trigger transition effect when level index changes mid-game
     if (gameState === GameState.PLAYING) {
       pipesRef.current = [];
       lettersRef.current = [];
       powerUpsRef.current = [];
       projectilesRef.current = [];
       warpRef.current = 90; 
       setCollectedMask(() => new Array(TARGET_WORD.length).fill(false));
       setLevelPhase('COLLECTING');
       setBossHealthPercent(100);
     }
  }, [currentLevelIndex, gameState, setCollectedMask, setLevelPhase, setBossHealthPercent]);

  // --- BOSS PHASE START ---
  useEffect(() => {
    if (levelPhase === 'BOSS_FIGHT' && canvasRef.current) {
      spawnBoss(canvasRef.current.width, canvasRef.current.height);
    }
  }, [levelPhase]);

  const handleJump = useCallback(() => {
    if (gameState === GameState.PLAYING) {
      birdRef.current.velocity = JUMP_STRENGTH;
    }
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.code === 'Space') { handleJump(); } };
    const handleTouch = (e: TouchEvent) => { e.preventDefault(); handleJump(); };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouch, { passive: false }); 
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouch);
    };
  }, [handleJump]);

  const update = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    if (gameState === GameState.PLAYING) {
      frameCountRef.current++;
      if (warpRef.current > 0) warpRef.current--;

      const bird = birdRef.current;
      
      const takeDamage = (fromPos: {x: number, y: number}) => {
        if (bird.hasShield) {
           bird.hasShield = false;
           invulnerableRef.current = 60;
           createExplosion(bird.x, bird.y, COLOR_SHIELD);
           bird.velocity = JUMP_STRENGTH / 2; 
        } else if (invulnerableRef.current === 0) {
           setLives(prev => {
             const newLives = prev - 1;
             if (newLives <= 0) setGameState(GameState.GAME_OVER);
             return newLives;
           });
           invulnerableRef.current = 120;
           createExplosion(bird.x, bird.y, COLOR_DANGER);
           bird.velocity = JUMP_STRENGTH; 
        }
      };

      // --- BOSS LOGIC ---
      if (levelPhase === 'BOSS_FIGHT') {
        const boss = bossRef.current;
        const config = currentLevel.bossConfig;

        // Update Health UI
        setBossHealthPercent((boss.health / boss.maxHealth) * 100);

        // --- BEHAVIOR TYPES ---
        // Move Boss into view if offscreen
        if (boss.x > width - 150) {
           boss.x -= 2;
        } else {
           // Specific AI
           if (config.behavior === 'STATIC') {
              boss.oscillationOffset += 0.05;
              boss.y = height/2 + Math.sin(boss.oscillationOffset) * 20;
           } else if (config.behavior === 'SIN_WAVE') {
              boss.oscillationOffset += 0.03;
              boss.y = height/2 + Math.sin(boss.oscillationOffset) * 150;
           } else if (config.behavior === 'TRACKING') {
              const dy = bird.y - boss.y;
              boss.y += dy * 0.05;
           } else if (config.behavior === 'PHASED') {
              // The Core Logic
              const hpPercent = boss.health / boss.maxHealth;
              if (hpPercent <= 0.25) boss.phase = 3;
              else if (hpPercent <= 0.5) boss.phase = 2;
              else boss.phase = 1;

              boss.oscillationOffset += boss.phase === 3 ? 0.1 : 0.03;
              let targetY = (height / 2) + Math.sin(boss.oscillationOffset) * 150;
              if (boss.phase === 3) targetY += (Math.random() - 0.5) * 10;
              boss.y += (targetY - boss.y) * 0.1;
           }
        }
        // Clamp Boss Y
        boss.y = Math.max(boss.height/2, Math.min(height - boss.height/2, boss.y));
        if (boss.isHit > 0) boss.isHit--;

        // WIN CONDITION
        if (boss.health <= 0) {
           createExplosion(boss.x, boss.y, COLOR_BOSS, 50);
           // Check if Game Won or Just Level Won
           if (currentLevelIndex >= LEVEL_CONFIGS.length - 1) {
             setGameState(GameState.VICTORY);
           } else {
             // Next Level
             setCurrentLevelIndex(prev => prev + 1);
           }
           return;
        }

        // --- BOSS SHOOTING ---
        boss.attackTimer++;
        let fireRate = config.fireRate;
        if (config.behavior === 'PHASED' && boss.phase === 3) fireRate = 35; // Enrage

        if (boss.attackTimer > fireRate) {
          boss.attackTimer = 0;
          // Fire logic
          const spawnProjectile = (type: ProjectileType, vx: number, vy: number, xOffset: number = 0) => {
             projectilesRef.current.push({
               id: Math.random().toString(), x: boss.x - 40 + xOffset, y: boss.y,
               vx, vy, type, damage: 1, active: true
             });
          };

          const dx = bird.x - boss.x;
          const dy = bird.y - boss.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          const dirX = dx/dist; const dirY = dy/dist;

          if (config.projectileType === 'LASER') {
             spawnProjectile('ENEMY_BOLT', -PROJECTILE_SPEED_LASER, 0); // Fast horizontal beam
          } else if (config.projectileType === 'BOOMERANG') {
             spawnProjectile('BOOMERANG', -6, 0); // Actually just using enemy projectile logic for simplicity or reuse logic
          } else if (config.projectileType === 'SPLIT') {
             spawnProjectile('ENEMY_BOLT', dirX * PROJECTILE_SPEED_ENEMY, dirY * PROJECTILE_SPEED_ENEMY);
             spawnProjectile('ENEMY_BOLT', dirX * PROJECTILE_SPEED_ENEMY, (dirY - 0.3) * PROJECTILE_SPEED_ENEMY);
             spawnProjectile('ENEMY_BOLT', dirX * PROJECTILE_SPEED_ENEMY, (dirY + 0.3) * PROJECTILE_SPEED_ENEMY);
          } else {
             // Standard
             spawnProjectile('ENEMY_BOLT', dirX * PROJECTILE_SPEED_ENEMY, dirY * PROJECTILE_SPEED_ENEMY);
          }
        }
      }

      // --- PROJECTILES UPDATE ---
      projectilesRef.current.forEach(p => {
        if (!p.active) return;
        
        if (p.type === 'ENEMY_BOLT') {
          p.x += p.vx; p.y += p.vy;
          if (Math.sqrt((p.x - bird.x)**2 + (p.y - bird.y)**2) < bird.radius + 10) {
            takeDamage({x: p.x, y: p.y});
            p.active = false;
          }
        } else {
          // Player Weapons
          if (levelPhase !== 'BOSS_FIGHT') { p.active = false; return; } // Clear if no boss
          const boss = bossRef.current;
          
          if (p.type === 'BOOMERANG') {
             let tx = 0, ty = 0;
             if (p.returnState === 'OUT') {
                tx = boss.x + 200; ty = boss.y;
                if (Math.sqrt((p.x - tx)**2 + (p.y - ty)**2) < 50 || p.x > tx) p.returnState = 'RETURN';
             } else {
                tx = bird.x; ty = bird.y;
             }
             const dx = tx - p.x; const dy = ty - p.y; const angle = Math.atan2(dy, dx);
             p.vx = Math.cos(angle) * PROJECTILE_SPEED_BOOMERANG;
             p.vy = Math.sin(angle) * PROJECTILE_SPEED_BOOMERANG;
             p.x += p.vx; p.y += p.vy;
          } else if (p.type === 'LASER') {
             const dx = boss.x - p.x; const dy = boss.y - p.y; const dist = Math.sqrt(dx*dx + dy*dy);
             if (dist > 0) { p.vx = (dx/dist)*PROJECTILE_SPEED_LASER; p.vy = (dy/dist)*PROJECTILE_SPEED_LASER; }
             p.x += p.vx; p.y += p.vy;
          } else {
             const dx = boss.x - p.x; const dy = boss.y - p.y; const dist = Math.sqrt(dx*dx + dy*dy);
             if (dist > 0) { p.x += (dx/dist)*PROJECTILE_SPEED_STANDARD; p.y += (dy/dist)*PROJECTILE_SPEED_STANDARD; }
          }

          // Hit Boss
          const distToBoss = Math.sqrt((p.x - boss.x)**2 + (p.y - boss.y)**2);
          if (distToBoss < boss.width/2 + 20) {
             if (p.type !== 'BOOMERANG') p.active = false;
             // Boomerangs hit multiple times, throttle?
             if (p.type === 'BOOMERANG' && frameCountRef.current % 10 !== 0) return;
             
             boss.health -= p.damage;
             boss.isHit = 5;
             createExplosion(p.x, p.y, p.type === 'LASER' ? COLOR_LASER : COLOR_AMMO, 5);
          }
        }
        if (p.x < -200 || p.x > width + 300 || p.y < -200 || p.y > height + 200) p.active = false;
      });
      projectilesRef.current = projectilesRef.current.filter(p => p.active);

      // --- BIRD ---
      bird.velocity += GRAVITY;
      bird.y += bird.velocity;
      bird.rotation = Math.min(Math.PI/4, Math.max(-Math.PI/4, bird.velocity * 0.1));

      if (bird.y + bird.radius >= height || bird.y - bird.radius <= 0) {
         takeDamage({x: bird.x, y: bird.y});
         bird.y = Math.max(bird.radius, Math.min(height - bird.radius, bird.y));
         if (bird.y >= height - bird.radius) bird.y = height - 50; 
      }

      // --- SPAWNING ---
      const spawnRate = currentLevel.pipeSpawnRate;
      const gapSize = currentLevel.pipeGap;
      const speed = currentLevel.pipeSpeed;

      // Stop pipes in Final Boss Phase 3
      const pipesEnabled = !(currentLevel.bossConfig.behavior === 'PHASED' && bossRef.current.phase === 3 && levelPhase === 'BOSS_FIGHT');

      if (frameCountRef.current % spawnRate === 0 && warpRef.current === 0) {
        const minPipeH = 50;
        const maxPipeH = height - gapSize - minPipeH;
        const randomH = Math.floor(Math.random() * (maxPipeH - minPipeH + 1)) + minPipeH;
        
        if (pipesEnabled) {
          pipesRef.current.push({
            x: width,
            topHeight: randomH,
            originalTopHeight: randomH,
            width: PIPE_WIDTH,
            passed: false,
            isMoving: currentLevel.hasMovingPipes && Math.random() < 0.5,
            moveOffset: Math.random() * Math.PI * 2
          });
        }

        const spawnX = width + 30;
        const spawnY = pipesEnabled ? randomH + (gapSize / 2) : Math.random() * (height - 100) + 50;

        if (levelPhase === 'BOSS_FIGHT') {
          // Spawn Weapons
          const rand = Math.random();
          let type: PowerUpType = 'AMMO';
          // Unlock better weapons in later levels
          if (currentLevelIndex >= 2 && rand > 0.9) type = 'LASER';
          else if (currentLevelIndex >= 1 && rand > 0.8) type = 'SPLIT';
          else if (currentLevelIndex >= 3 && rand > 0.7) type = 'BOOMERANG';
          else if (rand > 0.6) type = 'SHIELD';
          
          powerUpsRef.current.push({ id: Math.random().toString(), x: spawnX, y: spawnY, type, collected: false });
        } else {
          // Spawn Letters or Shield
          if (Math.random() < POWERUP_SPAWN_CHANCE) {
             powerUpsRef.current.push({ id: Math.random().toString(), x: spawnX, y: spawnY, type: 'SHIELD', collected: false });
          } else {
            const neededIndices = collectedMask.map((val, idx) => val ? -1 : idx).filter(i => i !== -1);
            let charToSpawn = 'G';
            if (neededIndices.length > 0 && Math.random() < 0.7) {
              const randomNeededIndex = neededIndices[Math.floor(Math.random() * neededIndices.length)];
              charToSpawn = TARGET_WORD[randomNeededIndex];
            } else {
              charToSpawn = TARGET_WORD[Math.floor(Math.random() * TARGET_WORD.length)];
            }
            lettersRef.current.push({
              id: Math.random().toString(),
              x: spawnX,
              y: spawnY,
              char: charToSpawn,
              collected: false,
              oscillationOffset: Math.random() * Math.PI * 2
            });
          }
        }
      }

      // Update Items
      pipesRef.current.forEach(pipe => {
        pipe.x -= speed;
        if (pipe.isMoving) {
          pipe.moveOffset += PIPE_MOVE_SPEED;
          pipe.topHeight = Math.max(20, Math.min(height - gapSize - 20, pipe.originalTopHeight + Math.sin(pipe.moveOffset) * PIPE_MOVE_AMPLITUDE));
        }
      });
      pipesRef.current = pipesRef.current.filter(p => p.x > -100);
      lettersRef.current.forEach(l => l.x -= speed);
      lettersRef.current = lettersRef.current.filter(l => l.x > -100 && !l.collected);
      powerUpsRef.current.forEach(p => p.x -= speed);
      powerUpsRef.current = powerUpsRef.current.filter(p => p.x > -100 && !p.collected);

      // Collisions
      pipesRef.current.forEach(pipe => {
        if (bird.x + bird.radius > pipe.x && bird.x - bird.radius < pipe.x + pipe.width) {
          if (bird.y - bird.radius < pipe.topHeight || bird.y + bird.radius > pipe.topHeight + gapSize) {
            takeDamage({x: bird.x, y: bird.y});
          }
        }
      });

      const checkCollection = (itemX: number, itemY: number, radius: number) => {
          const dx = bird.x - itemX; const dy = bird.y - itemY;
          return Math.sqrt(dx*dx + dy*dy) < bird.radius + radius;
      };

      // Item Collection
      lettersRef.current.forEach(letter => {
        if (checkCollection(letter.x, letter.y, 20)) {
           letter.collected = true;
           const targetIndex = TARGET_WORD.findIndex((c, i) => c === letter.char && !collectedMask[i]);
           if (targetIndex !== -1) {
              createExplosion(letter.x, letter.y, COLOR_SUCCESS);
              setCollectedMask(prev => {
                 const newMask = [...prev];
                 newMask[targetIndex] = true;
                 if (newMask.every(b => b)) {
                    // TRIGGER BOSS
                    setLevelPhase('BOSS_FIGHT');
                 }
                 return newMask;
              });
           } else {
              createExplosion(letter.x, letter.y, '#fff');
           }
        }
      });

      powerUpsRef.current.forEach(p => {
        if (checkCollection(p.x, p.y, 15)) {
           p.collected = true;
           if (p.type === 'SHIELD') { birdRef.current.hasShield = true; createExplosion(p.x, p.y, COLOR_SHIELD); }
           else {
              // Weapons
              if (levelPhase === 'BOSS_FIGHT') {
                 if (p.type === 'AMMO') {
                    projectilesRef.current.push({ id: Math.random().toString(), x: bird.x, y: bird.y, vx: 0, vy: 0, type: 'STANDARD', damage: 1, active: true });
                 } else if (p.type === 'SPLIT') {
                    for(let i=-1; i<=1; i++) projectilesRef.current.push({ id: Math.random().toString(), x: bird.x, y: bird.y, vx: 0, vy: 0, type: 'SPLIT', damage: 1, active: true });
                 } else if (p.type === 'LASER') {
                    projectilesRef.current.push({ id: Math.random().toString(), x: bird.x, y: bird.y, vx: PROJECTILE_SPEED_LASER, vy: 0, type: 'LASER', damage: 5, active: true });
                 } else if (p.type === 'BOOMERANG') {
                    projectilesRef.current.push({ id: Math.random().toString(), x: bird.x, y: bird.y, vx: 0, vy: 0, type: 'BOOMERANG', damage: 2, active: true, returnState: 'OUT' });
                 }
                 createExplosion(p.x, p.y, COLOR_AMMO);
              }
           }
        }
      });

      // Boss Collision
      if (levelPhase === 'BOSS_FIGHT') {
         const b = bossRef.current;
         if (bird.x + bird.radius > b.x - b.width/2 && bird.x - bird.radius < b.x + b.width/2 &&
             bird.y + bird.radius > b.y - b.height/2 && bird.y - bird.radius < b.y + b.height/2) {
               takeDamage({x: bird.x, y: bird.y});
         }
      }

      // Particles
      if (invulnerableRef.current > 0) invulnerableRef.current--;
      particlesRef.current.forEach(p => { p.x += p.vx; p.y += p.vy; p.life--; });
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);
    }

    // --- RENDER ---
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, currentLevel.bgColorTop); 
    gradient.addColorStop(1, currentLevel.bgColorBottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Cyber Grid
    if (currentLevel.id === 4) {
        ctx.strokeStyle = '#065f46'; ctx.lineWidth = 1;
        for(let i=0; i<width; i+=40) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,height); ctx.stroke(); }
        for(let i=0; i<height; i+=40) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(width,i); ctx.stroke(); }
    }

    if (gameState === GameState.PLAYING) {
       starsRef.current.forEach(star => {
         let starSpeed = star.speed * (currentLevel.id * 0.2 + 1);
         if (warpRef.current > 0) starSpeed *= 10; 
         star.x -= starSpeed;
         if (star.x < 0) { star.x = width; star.y = Math.random() * height; }
       });
       if (levelPhase === 'BOSS_FIGHT' && currentLevel.bossConfig.behavior === 'PHASED' && bossRef.current.phase === 3) {
          const shake = (Math.random() - 0.5) * 4; ctx.translate(shake, shake);
       }
    }

    starsRef.current.forEach(star => {
       ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
       ctx.beginPath(); ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2); ctx.fill();
       if (warpRef.current > 0) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${star.brightness * 0.5})`;
          ctx.lineWidth = star.size;
          ctx.beginPath(); ctx.moveTo(star.x, star.y); ctx.lineTo(star.x + 100, star.y); ctx.stroke();
       }
    });

    pipesRef.current.forEach(pipe => {
      ctx.fillStyle = currentLevel.pipeColor; 
      ctx.strokeStyle = currentLevel.pipeBorder;
      if (pipe.isMoving) { ctx.strokeStyle = '#f59e0b'; ctx.shadowBlur = 5; } 
      else { ctx.shadowBlur = 0; }
      ctx.lineWidth = 2;
      ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight);
      ctx.strokeRect(pipe.x, 0, pipe.width, pipe.topHeight);
      const bottomY = pipe.topHeight + currentLevel.pipeGap;
      ctx.fillRect(pipe.x, bottomY, pipe.width, height - bottomY);
      ctx.strokeRect(pipe.x, bottomY, pipe.width, height - bottomY);
      ctx.shadowBlur = 0;
    });

    const drawBoss = (ctx: CanvasRenderingContext2D, b: Boss, config: typeof currentLevel.bossConfig) => {
       ctx.save();
       ctx.translate(b.x, b.y);
       
       if (b.isHit > 0) {
         ctx.fillStyle = '#ffffff';
         ctx.globalCompositeOperation = 'source-over';
       } else {
         ctx.fillStyle = config.color;
       }
       ctx.strokeStyle = '#ffffff';
       ctx.lineWidth = 2;

       switch (currentLevel.id) {
         case 1: // SENTRY (Diamond + Eye)
           ctx.beginPath();
           ctx.moveTo(0, -b.height/2); ctx.lineTo(b.width/2, 0); ctx.lineTo(0, b.height/2); ctx.lineTo(-b.width/2, 0);
           ctx.closePath(); ctx.fill(); ctx.stroke();
           // Eye
           ctx.fillStyle = '#0ea5e9'; ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI*2); ctx.fill();
           break;

         case 2: // GUARDIAN (Shield shape)
           ctx.beginPath();
           ctx.moveTo(-b.width/2, -b.height/3); ctx.lineTo(b.width/2, -b.height/3);
           ctx.lineTo(b.width/2, 0); ctx.lineTo(0, b.height/2); ctx.lineTo(-b.width/2, 0);
           ctx.closePath(); ctx.fill(); ctx.stroke();
           ctx.fillStyle = '#8b5cf6'; ctx.fillRect(-b.width/4, -b.height/4, b.width/2, b.height/4);
           break;

         case 3: // HUNTER (Jet/Triangle)
           ctx.beginPath();
           ctx.moveTo(b.width/2, 0); ctx.lineTo(-b.width/2, -b.height/2); ctx.lineTo(-b.width/4, 0); ctx.lineTo(-b.width/2, b.height/2);
           ctx.closePath(); ctx.fill(); ctx.stroke();
           // Engine
           ctx.fillStyle = '#f97316'; ctx.beginPath(); ctx.arc(-b.width/2, 0, 10, 0, Math.PI*2); ctx.fill();
           break;

         case 4: // SNIPER (Crosshair/Satellite)
           ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI*2); ctx.fill(); ctx.stroke(); // Core
           ctx.lineWidth = 4; 
           ctx.beginPath(); ctx.moveTo(0, -b.height/2); ctx.lineTo(0, b.height/2); ctx.stroke(); // Vertical Rail
           ctx.beginPath(); ctx.moveTo(-b.width/2, 0); ctx.lineTo(b.width/2, 0); ctx.stroke(); // Horizontal Rail
           ctx.strokeStyle = '#14b8a6'; ctx.beginPath(); ctx.arc(0, 0, b.width/2, 0, Math.PI*2); ctx.stroke(); // Outer Ring
           break;
         
         case 5: // JUGGERNAUT (Tank block)
           ctx.fillRect(-b.width/2, -b.height/2, b.width, b.height);
           ctx.strokeRect(-b.width/2, -b.height/2, b.width, b.height);
           // Spikes/Turrets
           ctx.fillStyle = '#374151';
           ctx.beginPath(); ctx.arc(-b.width/2, -b.height/2, 10, 0, Math.PI*2); ctx.fill();
           ctx.beginPath(); ctx.arc(b.width/2, -b.height/2, 10, 0, Math.PI*2); ctx.fill();
           ctx.beginPath(); ctx.arc(b.width/2, b.height/2, 10, 0, Math.PI*2); ctx.fill();
           ctx.beginPath(); ctx.arc(-b.width/2, b.height/2, 10, 0, Math.PI*2); ctx.fill();
           break;

         case 6: // THE CORE (Complex Orb)
         default:
           // Outer ring
           ctx.beginPath(); ctx.arc(0, 0, b.width/2, 0, Math.PI*2); ctx.fillStyle = '#450a0a'; ctx.fill(); ctx.stroke();
           // Inner rotating ring
           ctx.save(); ctx.rotate(frameCountRef.current * 0.05);
           ctx.setLineDash([5, 5]); ctx.strokeStyle = '#ef4444'; ctx.beginPath(); ctx.arc(0, 0, b.width/3, 0, Math.PI*2); ctx.stroke();
           ctx.restore();
           // Core
           ctx.fillStyle = '#f87171'; ctx.beginPath(); ctx.arc(0, 0, b.width/6, 0, Math.PI*2); ctx.fill();
           break;
       }

       ctx.restore();
    };

    if (levelPhase === 'BOSS_FIGHT') {
      drawBoss(ctx, bossRef.current, currentLevel.bossConfig);
    }

    projectilesRef.current.forEach(p => {
      ctx.save(); ctx.translate(p.x, p.y);
      let color = COLOR_AMMO;
      if (p.type === 'LASER') color = COLOR_LASER; else if (p.type === 'SPLIT') color = COLOR_SPLIT; else if (p.type === 'BOOMERANG') color = COLOR_BOOMERANG; else if (p.type === 'ENEMY_BOLT') color = COLOR_ENEMY_BOLT;
      ctx.fillStyle = color;
      if (p.type === 'LASER') {
        const angle = Math.atan2(p.vy, p.vx); ctx.rotate(angle);
        ctx.shadowColor = color; ctx.shadowBlur = 15; ctx.fillRect(-30, -6, 60, 12); 
        ctx.shadowBlur = 0; ctx.fillStyle = '#ffffff'; ctx.fillRect(-30, -2, 60, 4);
      } else if (p.type === 'BOOMERANG') {
        ctx.rotate(frameCountRef.current * 0.5);
        ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(8, 8); ctx.lineTo(0, 4); ctx.lineTo(-8, 8); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = color; ctx.stroke();
      } else {
        ctx.beginPath(); ctx.arc(0,0, p.type === 'ENEMY_BOLT' ? 6 : 5, 0, Math.PI*2); ctx.fill();
      }
      ctx.restore();
    });

    powerUpsRef.current.forEach(p => {
       ctx.beginPath(); ctx.arc(p.x, p.y, 15, 0, Math.PI * 2);
       let color = COLOR_AMMO; let letter = 'A';
       if (p.type === 'SHIELD') { color = COLOR_SHIELD; letter = 'S'; }
       else if (p.type === 'SPLIT') { color = COLOR_SPLIT; letter = 'x3'; }
       else if (p.type === 'LASER') { color = COLOR_LASER; letter = 'L'; }
       else if (p.type === 'BOOMERANG') { color = COLOR_BOOMERANG; letter = 'B'; }
       ctx.fillStyle = color + '44'; ctx.strokeStyle = color; ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
       ctx.fillStyle = '#ffffff'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(letter, p.x, p.y);
    });

    if (levelPhase === 'COLLECTING') {
      ctx.font = "bold 24px 'Space Mono'"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      lettersRef.current.forEach(letter => {
        const isNeeded = TARGET_WORD.some((c, i) => c === letter.char && !collectedMask[i]);
        ctx.beginPath(); ctx.arc(letter.x, letter.y, 20, 0, Math.PI * 2);
        ctx.fillStyle = isNeeded ? COLOR_SUCCESS : '#475569'; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = '#ffffff'; ctx.stroke();
        ctx.fillStyle = '#ffffff'; ctx.fillText(letter.char, letter.x, letter.y + 2);
      });
    }

    particlesRef.current.forEach(p => {
      ctx.fillStyle = p.color; ctx.globalAlpha = p.life / 30;
      ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1.0;
    });

    const bird = birdRef.current;
    if (invulnerableRef.current === 0 || Math.floor(frameCountRef.current / 4) % 2 === 0) {
      ctx.save(); ctx.translate(bird.x, bird.y); ctx.rotate(bird.rotation);
      if (bird.hasShield) {
        ctx.beginPath(); ctx.arc(0, 0, bird.radius + 8, 0, Math.PI * 2);
        ctx.strokeStyle = COLOR_SHIELD; ctx.lineWidth = 2; ctx.setLineDash([5, 3]); ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.beginPath(); ctx.arc(0, 0, bird.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#fbbf24'; ctx.fill();
      ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(8, -5, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'black'; ctx.beginPath(); ctx.arc(10, -5, 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.ellipse(-5, 5, 10, 6, 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    requestRef.current = requestAnimationFrame(update);
  }, [gameState, lives, collectedMask, currentLevelIndex, levelPhase, setGameState, setLives, setLevelPhase, setCollectedMask, setCurrentLevelIndex, setBossHealthPercent, safeLevelIndex, currentLevel]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [update]);

  return (
    <canvas ref={canvasRef} width={800} height={600} className="w-full h-full max-w-[800px] max-h-[600px] border-2 border-slate-700 rounded-lg shadow-2xl bg-slate-900" />
  );
};

export default GameCanvas;
