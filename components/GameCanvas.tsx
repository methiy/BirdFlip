
import React, { useRef, useEffect, useCallback } from 'react';
import { GameState, Bird, Pipe, FloatingLetter, Particle, PowerUp, Star, Boss, Projectile, PowerUpType } from '../types';
import { 
  GRAVITY, JUMP_STRENGTH, PIPE_SPEED, PIPE_SPAWN_RATE, 
  PIPE_GAP, PIPE_WIDTH, BIRD_X, TARGET_WORD, 
  SETS_TO_UNLOCK_FINAL,
  COLOR_SUCCESS, COLOR_DANGER, COLOR_SHIELD, COLOR_AMMO, COLOR_BOSS,
  COLOR_SPLIT, COLOR_LASER, COLOR_BOOMERANG, COLOR_ENEMY_BOLT,
  PIPE_MOVE_AMPLITUDE, PIPE_MOVE_SPEED, POWERUP_SPAWN_CHANCE,
  BOSS_MAX_HEALTH, BOSS_WIDTH, BOSS_HEIGHT,
  PROJECTILE_SPEED_STANDARD, PROJECTILE_SPEED_LASER, PROJECTILE_SPEED_BOOMERANG, PROJECTILE_SPEED_ENEMY,
  BOSS_ATTACK_COOLDOWN_PHASE_2, BOSS_ATTACK_COOLDOWN_PHASE_3
} from '../constants';

interface GameCanvasProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  lives: number;
  setLives: (fn: (prev: number) => number) => void;
  collectedMask: boolean[];
  setCollectedMask: (fn: (prev: boolean[]) => boolean[]) => void;
  setsCollected: number;
  setSetsCollected: (fn: (prev: number) => number) => void;
  setFinalProgress: (val: number) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState,
  setGameState,
  lives,
  setLives,
  collectedMask,
  setCollectedMask,
  setsCollected,
  setSetsCollected,
  setFinalProgress
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const frameCountRef = useRef(0);
  const invulnerableRef = useRef(0); 
  
  // Mutable game state references
  const birdRef = useRef<Bird>({ x: BIRD_X, y: 300, velocity: 0, radius: 20, rotation: 0, hasShield: false });
  const pipesRef = useRef<Pipe[]>([]);
  const lettersRef = useRef<FloatingLetter[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<Star[]>([]);
  
  // Boss State
  const bossRef = useRef<Boss>({ 
    x: 0, y: 0, width: BOSS_WIDTH, height: BOSS_HEIGHT, 
    health: BOSS_MAX_HEALTH, maxHealth: BOSS_MAX_HEALTH, 
    oscillationOffset: 0, isHit: 0, attackTimer: 0, phase: 1
  });
  const projectilesRef = useRef<Projectile[]>([]);

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
        speed: Math.random() * 3 + 0.5, // Parallax speed
        brightness: Math.random()
      });
    }
    starsRef.current = stars;
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
    
    setCollectedMask(() => new Array(TARGET_WORD.length).fill(false));
    setSetsCollected(() => 0);
    setLives(() => 3);
    setFinalProgress(100); 
    
    if (canvasRef.current) {
      const { width, height } = canvasRef.current;
      initStars(width, height);
      bossRef.current = {
        x: width - 150,
        y: height / 2,
        width: BOSS_WIDTH,
        height: BOSS_HEIGHT,
        health: BOSS_MAX_HEALTH,
        maxHealth: BOSS_MAX_HEALTH,
        oscillationOffset: 0,
        isHit: 0,
        attackTimer: 0,
        phase: 1
      };
    }
  }, [setCollectedMask, setLives, setSetsCollected, setFinalProgress]);

  useEffect(() => {
    if (gameState === GameState.START) {
      resetGame();
    }
  }, [gameState, resetGame]);

  const handleJump = useCallback(() => {
    if (gameState === GameState.PLAYING || gameState === GameState.START) {
      if (gameState === GameState.START) {
        setGameState(GameState.PLAYING);
      }
      birdRef.current.velocity = JUMP_STRENGTH;
    }
  }, [gameState, setGameState]);

  // Input listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleJump();
      }
    };
    const handleTouch = (e: TouchEvent) => {
        e.preventDefault();
        handleJump();
    };
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
      const isFinalLevel = setsCollected >= SETS_TO_UNLOCK_FINAL;
      const bird = birdRef.current;
      
      // --- DAMAGE HELPER ---
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

      // --- BOSS LOGIC (Final Level) ---
      if (isFinalLevel) {
        const boss = bossRef.current;
        
        // DETERMINE PHASE
        const hpPercent = boss.health / boss.maxHealth;
        if (hpPercent <= 0.25) boss.phase = 3;
        else if (hpPercent <= 0.5) boss.phase = 2;
        else boss.phase = 1;

        // Hover movement (Faster in Phase 3)
        boss.oscillationOffset += boss.phase === 3 ? 0.1 : 0.03;
        let targetY = (height / 2) + Math.sin(boss.oscillationOffset) * 150;
        
        // Shake in phase 3
        if (boss.phase === 3) targetY += (Math.random() - 0.5) * 10;
        
        boss.y += (targetY - boss.y) * 0.1;
        boss.y = Math.max(boss.height/2, Math.min(height - boss.height/2, boss.y));
        
        if (boss.isHit > 0) boss.isHit--;

        // Win Condition
        if (boss.health <= 0) {
          createExplosion(boss.x, boss.y, COLOR_BOSS, 50);
          setGameState(GameState.VICTORY);
          return;
        }

        // BOSS ATTACK LOGIC
        if (boss.phase >= 2) {
          boss.attackTimer++;
          const cooldown = boss.phase === 3 ? BOSS_ATTACK_COOLDOWN_PHASE_3 : BOSS_ATTACK_COOLDOWN_PHASE_2;
          
          if (boss.attackTimer > cooldown) {
            boss.attackTimer = 0;
            // Fire at player
            const dx = bird.x - boss.x;
            const dy = bird.y - boss.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            projectilesRef.current.push({
              id: Math.random().toString(),
              x: boss.x - 40,
              y: boss.y,
              vx: (dx / dist) * PROJECTILE_SPEED_ENEMY,
              vy: (dy / dist) * PROJECTILE_SPEED_ENEMY,
              type: 'ENEMY_BOLT',
              damage: 1,
              active: true
            });
          }
        }
      }

      // --- PROJECTILE UPDATE ---
      projectilesRef.current.forEach(p => {
        if (!p.active) return;
        
        if (p.type === 'ENEMY_BOLT') {
          // Logic for Enemy Bullets
          p.x += p.vx;
          p.y += p.vy;
          // Check collision with player
          const dist = Math.sqrt((p.x - bird.x)**2 + (p.y - bird.y)**2);
          if (dist < bird.radius + 10) {
            takeDamage({x: p.x, y: p.y});
            p.active = false;
          }
        } else {
          // Logic for Player Bullets
          const boss = bossRef.current;
          if (p.type === 'BOOMERANG') {
             p.x += p.vx;
             p.y += p.vy;
             
             // Boomerang physics
             if (p.returnState === 'OUT') {
               p.vx -= 0.2; // Decelerate
               if (p.vx < -PROJECTILE_SPEED_BOOMERANG) p.returnState = 'RETURN';
             } else {
               // Should technically fly back to player, but simple return sweep is fun
               // Keep flying left
             }
          } else if (p.type === 'LASER') {
             p.x += p.vx;
             p.y += p.vy;
          } else {
             // Standard Homing
             const dx = boss.x - p.x;
             const dy = boss.y - p.y;
             const dist = Math.sqrt(dx*dx + dy*dy);
             if (dist > 0) {
               p.x += (dx / dist) * PROJECTILE_SPEED_STANDARD;
               p.y += (dy / dist) * PROJECTILE_SPEED_STANDARD;
             }
          }

          // Check Collision with Boss
          const distToBoss = Math.sqrt((p.x - boss.x)**2 + (p.y - boss.y)**2);
          // Boomerang can hit multiple times, others single hit
          if (distToBoss < boss.width/2 + 10) {
             if (p.type === 'BOOMERANG') {
               // Only damage every 10 frames for boomerang passing through
               // For simplicity, let's just let it hit once per pass? 
               // Let's make it always hit but destroy if not boomerang
               // Or simple: Boomerang pierces.
               boss.health -= p.damage * 0.1; // Continuous damage
               boss.isHit = 2;
               createExplosion(p.x, p.y, COLOR_AMMO, 2);
             } else {
               p.active = false;
               boss.health -= p.damage;
               boss.isHit = 10;
               createExplosion(p.x, p.y, COLOR_AMMO, 10);
             }
             setFinalProgress((boss.health / boss.maxHealth) * 100);
          }
        }
        
        // Cleanup out of bounds
        if (p.x < -100 || p.x > width + 100) p.active = false;
      });
      projectilesRef.current = projectilesRef.current.filter(p => p.active);

      // --- BIRD PHYSICS ---
      bird.velocity += GRAVITY;
      bird.y += bird.velocity;
      bird.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (bird.velocity * 0.1)));

      // World Bounds
      if (bird.y + bird.radius >= height || bird.y - bird.radius <= 0) {
         takeDamage({x: bird.x, y: bird.y});
         bird.y = Math.max(bird.radius, Math.min(height - bird.radius, bird.y));
         if (bird.y >= height - bird.radius) bird.y = height - 50; 
      }

      // --- SPAWNING (Pipes & Items) ---
      const currentSpeed = isFinalLevel ? PIPE_SPEED * 1.2 + (bossRef.current.phase === 3 ? 2 : 0) : PIPE_SPEED;
      const spawnRateDivisor = isFinalLevel ? 1.1 : 1;
      
      if (frameCountRef.current % Math.floor(PIPE_SPAWN_RATE / spawnRateDivisor) === 0) {
        const minPipeH = 50;
        const maxPipeH = height - PIPE_GAP - minPipeH;
        const randomH = Math.floor(Math.random() * (maxPipeH - minPipeH + 1)) + minPipeH;
        
        // *** CRITICAL: STOP PIPES IN PHASE 3 ***
        const shouldSpawnPipe = !isFinalLevel || bossRef.current.phase < 3;

        if (shouldSpawnPipe) {
          const isMovingPipe = Math.random() < 0.4;
          pipesRef.current.push({
            x: width,
            topHeight: randomH,
            originalTopHeight: randomH,
            width: PIPE_WIDTH,
            passed: false,
            isMoving: isMovingPipe,
            moveOffset: Math.random() * Math.PI * 2
          });
        }

        // Item Spawning (Decoupled from pipes for Phase 3)
        const spawnX = width + 30;
        const spawnY = randomH + (PIPE_GAP / 2); // Use the calculated height even if pipe doesn't spawn
        
        // Make sure spawnY is valid if no pipe
        const safeSpawnY = shouldSpawnPipe ? spawnY : Math.random() * (height - 100) + 50;

        if (isFinalLevel) {
          // Final Level: Spawn Weapons
          const rand = Math.random();
          let type: PowerUpType = 'AMMO';
          if (rand > 0.9) type = 'LASER';
          else if (rand > 0.8) type = 'SPLIT';
          else if (rand > 0.7) type = 'BOOMERANG';
          else if (rand > 0.65) type = 'SHIELD'; // Rare shield in final

          powerUpsRef.current.push({
            id: Math.random().toString(),
            x: spawnX,
            y: safeSpawnY,
            type: type,
            collected: false
          });
        } else {
          // Normal Level
          if (Math.random() < POWERUP_SPAWN_CHANCE) {
             powerUpsRef.current.push({
               id: Math.random().toString(),
               x: spawnX,
               y: safeSpawnY,
               type: 'SHIELD',
               collected: false
             });
          } else {
            const neededIndices = collectedMask.map((val, idx) => val ? -1 : idx).filter(i => i !== -1);
            let charToSpawn: string;
            if (neededIndices.length > 0 && Math.random() < 0.6) {
              const randomNeededIndex = neededIndices[Math.floor(Math.random() * neededIndices.length)];
              charToSpawn = TARGET_WORD[randomNeededIndex];
            } else {
              charToSpawn = TARGET_WORD[Math.floor(Math.random() * TARGET_WORD.length)];
            }
            lettersRef.current.push({
              id: Math.random().toString(),
              x: spawnX,
              y: safeSpawnY,
              char: charToSpawn,
              collected: false,
              oscillationOffset: Math.random() * Math.PI * 2
            });
          }
        }
      }

      // --- ENTITY UPDATES ---
      pipesRef.current.forEach(pipe => {
        pipe.x -= currentSpeed;
        if (pipe.isMoving) {
          pipe.moveOffset += PIPE_MOVE_SPEED;
          const delta = Math.sin(pipe.moveOffset) * PIPE_MOVE_AMPLITUDE;
          pipe.topHeight = Math.max(20, Math.min(height - PIPE_GAP - 20, pipe.originalTopHeight + delta));
        }
      });

      // Filter
      pipesRef.current = pipesRef.current.filter(p => p.x + p.width > -50);
      lettersRef.current = lettersRef.current.filter(l => l.x > -50 && !l.collected);
      powerUpsRef.current = powerUpsRef.current.filter(p => p.x > -50 && !p.collected);

      // --- COLLISIONS ---
      
      // 1. Pipes
      pipesRef.current.forEach(pipe => {
        if (bird.x + bird.radius > pipe.x && bird.x - bird.radius < pipe.x + pipe.width) {
          if (bird.y - bird.radius < pipe.topHeight || bird.y + bird.radius > pipe.topHeight + PIPE_GAP) {
            takeDamage({x: bird.x, y: bird.y});
          }
        }
      });

      // 2. Items & Powerups
      const checkCollection = (itemX: number, itemY: number, radius: number) => {
          const dx = bird.x - itemX;
          const dy = bird.y - itemY;
          return Math.sqrt(dx*dx + dy*dy) < bird.radius + radius;
      };

      if (!isFinalLevel) {
        // ... Letter collection code (unchanged) ...
        lettersRef.current.forEach(letter => {
          if (checkCollection(letter.x, letter.y, 20)) {
            letter.collected = true;
            const char = letter.char;
            const targetIndex = TARGET_WORD.findIndex((c, i) => c === char && !collectedMask[i]);
            if (targetIndex !== -1) {
              createExplosion(letter.x, letter.y, COLOR_SUCCESS);
              setCollectedMask(prev => {
                const newMask = [...prev];
                newMask[targetIndex] = true;
                if (newMask.every(b => b)) {
                  setLives(l => l + 1); 
                  setSetsCollected(s => s + 1);
                  return new Array(TARGET_WORD.length).fill(false);
                }
                return newMask;
              });
            } else {
              createExplosion(letter.x, letter.y, '#ffffff');
            }
          } else {
            letter.x -= currentSpeed;
            letter.y += Math.sin(frameCountRef.current * 0.05 + letter.oscillationOffset) * 0.5;
          }
        });
      }

      // Powerups (Shields & Ammo/Weapons)
      powerUpsRef.current.forEach(p => {
        if (checkCollection(p.x, p.y, 15)) {
            p.collected = true;
            
            if (p.type === 'SHIELD') {
              birdRef.current.hasShield = true;
              createExplosion(p.x, p.y, COLOR_SHIELD);
            } 
            else {
              // Weapon Firing Logic
              const targetX = bossRef.current.x;
              const targetY = bossRef.current.y;

              if (p.type === 'AMMO') {
                projectilesRef.current.push({
                  id: Math.random().toString(),
                  x: bird.x, y: bird.y, vx: 0, vy: 0,
                  type: 'STANDARD', damage: 1, active: true
                });
                createExplosion(p.x, p.y, COLOR_AMMO, 5);
              } 
              else if (p.type === 'SPLIT') {
                 for(let i=-1; i<=1; i++) {
                   projectilesRef.current.push({
                    id: Math.random().toString(),
                    x: bird.x, y: bird.y + i*20, vx: 0, vy: 0,
                    type: 'SPLIT', damage: 1, active: true
                   });
                 }
                 createExplosion(p.x, p.y, COLOR_SPLIT, 8);
              }
              else if (p.type === 'LASER') {
                 projectilesRef.current.push({
                  id: Math.random().toString(),
                  x: bird.x, y: bird.y, vx: PROJECTILE_SPEED_LASER, vy: 0,
                  type: 'LASER', damage: 5, active: true
                 });
                 createExplosion(p.x, p.y, COLOR_LASER, 10);
              }
              else if (p.type === 'BOOMERANG') {
                 projectilesRef.current.push({
                  id: Math.random().toString(),
                  x: bird.x, y: bird.y, vx: PROJECTILE_SPEED_BOOMERANG, vy: 0,
                  type: 'BOOMERANG', damage: 2, active: true,
                  returnState: 'OUT'
                 });
                 createExplosion(p.x, p.y, COLOR_BOOMERANG, 5);
              }
            }
        } else {
            p.x -= currentSpeed;
            p.y += Math.sin(frameCountRef.current * 0.1) * 1;
        }
      });

      // Boss Collision (Body)
      if (isFinalLevel) {
        const b = bossRef.current;
        if (bird.x + bird.radius > b.x - b.width/2 &&
            bird.x - bird.radius < b.x + b.width/2 &&
            bird.y + bird.radius > b.y - b.height/2 &&
            bird.y - bird.radius < b.y + b.height/2) {
              takeDamage({x: bird.x, y: bird.y});
        }
      }

      // Particles
      if (invulnerableRef.current > 0) invulnerableRef.current--;
      particlesRef.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
      });
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);
    }

    // --- VISUALS ---
    const isFinalLevel = setsCollected >= SETS_TO_UNLOCK_FINAL;
    
    if (gameState === GameState.PLAYING) {
       starsRef.current.forEach(star => {
         star.x -= star.speed * (isFinalLevel ? (bossRef.current.phase === 3 ? 4 : 2) : 1);
         if (star.x < 0) {
           star.x = width;
           star.y = Math.random() * height;
         }
       });
       // Shake Effect in Phase 3
       if (isFinalLevel && bossRef.current.phase === 3) {
          const shake = (Math.random() - 0.5) * 4;
          ctx.translate(shake, shake);
       }
    }

    // Draw Background
    if (isFinalLevel) {
      const phase = bossRef.current.phase;
      ctx.fillStyle = phase === 3 ? '#2a0505' : '#1a0505'; 
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = phase === 3 ? '#550000' : '#330000';
      ctx.lineWidth = 2;
      const offset = (frameCountRef.current * (phase === 3 ? 20 : 10)) % 50;
      for (let x = -offset; x < width; x += 50) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
    } else {
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#0f172a'); 
      gradient.addColorStop(1, '#1e293b');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }

    // Stars
    starsRef.current.forEach(star => {
       ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
       ctx.beginPath(); ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2); ctx.fill();
    });

    // Pipes
    pipesRef.current.forEach(pipe => {
      ctx.fillStyle = isFinalLevel ? '#7f1d1d' : '#334155'; 
      ctx.strokeStyle = isFinalLevel ? '#ef4444' : '#94a3b8'; 
      if (pipe.isMoving) {
         ctx.strokeStyle = '#f59e0b';
         ctx.shadowColor = '#f59e0b';
         ctx.shadowBlur = 5;
      } else {
         ctx.shadowBlur = 0;
      }
      ctx.lineWidth = 2;
      ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight);
      ctx.strokeRect(pipe.x, 0, pipe.width, pipe.topHeight);
      const bottomY = pipe.topHeight + PIPE_GAP;
      ctx.fillRect(pipe.x, bottomY, pipe.width, height - bottomY);
      ctx.strokeRect(pipe.x, bottomY, pipe.width, height - bottomY);
      ctx.shadowBlur = 0;
    });

    // Boss
    if (isFinalLevel) {
      const b = bossRef.current;
      ctx.save();
      ctx.translate(b.x, b.y);
      
      if (b.isHit > 0) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'white';
      } else {
        ctx.fillStyle = b.phase === 3 ? '#500724' : '#7f1d1d'; // Darker in rage
      }
      
      ctx.beginPath(); ctx.arc(0, 0, 40, 0, Math.PI*2); ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = b.phase === 3 ? '#ff0000' : '#ef4444';
      ctx.stroke();

      ctx.rotate(frameCountRef.current * (b.phase === 3 ? 0.2 : 0.05));
      ctx.strokeStyle = '#991b1b';
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(0, 0, 60, 0, Math.PI*(b.phase === 3 ? 1.8 : 1.5)); ctx.stroke();
      
      ctx.restore();
    }

    // Projectiles
    projectilesRef.current.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      
      let color = COLOR_AMMO;
      if (p.type === 'LASER') color = COLOR_LASER;
      else if (p.type === 'SPLIT') color = COLOR_SPLIT;
      else if (p.type === 'BOOMERANG') color = COLOR_BOOMERANG;
      else if (p.type === 'ENEMY_BOLT') color = COLOR_ENEMY_BOLT;

      ctx.fillStyle = color;
      
      if (p.type === 'LASER') {
        ctx.fillRect(-20, -3, 40, 6);
        ctx.shadowColor = color; ctx.shadowBlur = 10;
      } else {
        ctx.beginPath(); ctx.arc(0,0, p.type === 'ENEMY_BOLT' ? 6 : 5, 0, Math.PI*2); ctx.fill();
        // Trail
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(-15, 0);
        ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
      }
      
      ctx.restore();
    });

    // PowerUps
    powerUpsRef.current.forEach(p => {
       ctx.beginPath();
       ctx.arc(p.x, p.y, 15, 0, Math.PI * 2);
       
       let color = COLOR_AMMO;
       let letter = 'A';
       if (p.type === 'SHIELD') { color = COLOR_SHIELD; letter = 'S'; }
       else if (p.type === 'SPLIT') { color = COLOR_SPLIT; letter = 'x3'; }
       else if (p.type === 'LASER') { color = COLOR_LASER; letter = 'L'; }
       else if (p.type === 'BOOMERANG') { color = COLOR_BOOMERANG; letter = 'B'; }

       ctx.fillStyle = color + '44'; // Transparent
       ctx.strokeStyle = color;
       ctx.fill();
       ctx.lineWidth = 2;
       ctx.stroke();
       
       ctx.fillStyle = '#ffffff';
       ctx.font = 'bold 12px Arial';
       ctx.textAlign = 'center';
       ctx.textBaseline = 'middle';
       ctx.fillText(letter, p.x, p.y);
    });

    // Letters (Normal Mode)
    if (!isFinalLevel) {
      ctx.font = "bold 24px 'Space Mono'";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      lettersRef.current.forEach(letter => {
        const isNeeded = TARGET_WORD.some((c, i) => c === letter.char && !collectedMask[i]);
        ctx.beginPath(); ctx.arc(letter.x, letter.y, 20, 0, Math.PI * 2);
        ctx.fillStyle = isNeeded ? COLOR_SUCCESS : '#475569'; 
        ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = '#ffffff'; ctx.stroke();
        ctx.fillStyle = '#ffffff'; ctx.fillText(letter.char, letter.x, letter.y + 2);
      });
    }

    // Particles
    particlesRef.current.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / 30;
      ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1.0;
    });

    // Bird
    const bird = birdRef.current;
    if (invulnerableRef.current === 0 || Math.floor(frameCountRef.current / 4) % 2 === 0) {
      ctx.save();
      ctx.translate(bird.x, bird.y);
      ctx.rotate(bird.rotation);
      
      if (bird.hasShield) {
        ctx.beginPath(); ctx.arc(0, 0, bird.radius + 8, 0, Math.PI * 2);
        ctx.strokeStyle = COLOR_SHIELD; ctx.lineWidth = 2; ctx.setLineDash([5, 3]); ctx.stroke();
        ctx.setLineDash([]); ctx.fillStyle = 'rgba(6, 182, 212, 0.2)'; ctx.fill();
      }

      ctx.beginPath(); ctx.arc(0, 0, bird.radius, 0, Math.PI * 2);
      ctx.fillStyle = isFinalLevel ? '#fca5a5' : '#fbbf24'; ctx.fill();
      
      ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(8, -5, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'black'; ctx.beginPath(); ctx.arc(10, -5, 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = isFinalLevel ? '#b91c1c' : '#f59e0b';
      ctx.beginPath(); ctx.ellipse(-5, 5, 10, 6, 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    
    // Reset transform for next frame shake
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    requestRef.current = requestAnimationFrame(update);
  }, [gameState, lives, collectedMask, setsCollected, setGameState, setLives, setFinalProgress, setCollectedMask, setSetsCollected]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [update]);

  return (
    <canvas ref={canvasRef} width={800} height={600} className="w-full h-full max-w-[800px] max-h-[600px] border-2 border-slate-700 rounded-lg shadow-2xl bg-slate-900" />
  );
};

export default GameCanvas;