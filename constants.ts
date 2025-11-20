
import { LevelConfig } from './types';

export const GRAVITY = 0.4;
export const JUMP_STRENGTH = -7.5;
export const PIPE_WIDTH = 60;
export const BIRD_X = 100; // Fixed X position of bird
export const GROUND_HEIGHT = 50;

export const TARGET_WORD = ['G', 'E', 'M', 'I', 'N', 'I'];

// New Mechanics
export const PIPE_MOVE_AMPLITUDE = 80; 
export const PIPE_MOVE_SPEED = 0.05;
export const POWERUP_SPAWN_CHANCE = 0.35; 

// Boss Mechanics
export const BOSS_MAX_HEALTH = 60;
export const BOSS_WIDTH = 120;
export const BOSS_HEIGHT = 120;

// Projectiles
export const PROJECTILE_SPEED_STANDARD = 12;
export const PROJECTILE_SPEED_LASER = 25;
export const PROJECTILE_SPEED_BOOMERANG = 9;
export const PROJECTILE_SPEED_ENEMY = 6;

export const BOSS_ATTACK_COOLDOWN_PHASE_2 = 120; // Frames
export const BOSS_ATTACK_COOLDOWN_PHASE_3 = 35;  // Rapid fire

// Colors
export const COLOR_PRIMARY = '#4F46E5'; // Indigo 600
export const COLOR_ACCENT = '#EC4899'; // Pink 500
export const COLOR_SUCCESS = '#10B981'; // Emerald 500
export const COLOR_DANGER = '#EF4444'; // Red 500

export const COLOR_SHIELD = '#06b6d4'; // Cyan 500
export const COLOR_AMMO = '#f59e0b'; // Amber 500
export const COLOR_SPLIT = '#a855f7'; // Purple 500
export const COLOR_LASER = '#22d3ee'; // Cyan 400
export const COLOR_BOOMERANG = '#84cc16'; // Lime 500
export const COLOR_BOSS = '#991b1b'; // Red 800
export const COLOR_ENEMY_BOLT = '#dc2626'; // Red 600

export const LEVEL_CONFIGS: LevelConfig[] = [
  {
    id: 1,
    name: "DEEP SPACE",
    subtitle: "INITIATING SEQUENCE",
    bgColorTop: '#0f172a', // Slate 900
    bgColorBottom: '#1e293b', // Slate 800
    pipeColor: '#334155', // Slate 700
    pipeBorder: '#94a3b8', // Slate 400
    pipeSpeed: 3.5,
    pipeGap: 200,
    pipeSpawnRate: 100,
    hasMovingPipes: false,
    isBossLevel: false
  },
  {
    id: 2,
    name: "NEBULA DRIFT",
    subtitle: "CAUTION: MOVING OBSTACLES",
    bgColorTop: '#2e1065', // Violet 950
    bgColorBottom: '#4c1d95', // Violet 900
    pipeColor: '#5b21b6', // Violet 800
    pipeBorder: '#a78bfa', // Violet 400
    pipeSpeed: 4.0,
    pipeGap: 190,
    pipeSpawnRate: 90,
    hasMovingPipes: true,
    isBossLevel: false
  },
  {
    id: 3,
    name: "SOLAR FLARE",
    subtitle: "HIGH TEMPERATURE WARNING",
    bgColorTop: '#451a03', // Amber 950
    bgColorBottom: '#78350f', // Amber 900
    pipeColor: '#92400e', // Amber 800
    pipeBorder: '#fbbf24', // Amber 400
    pipeSpeed: 4.5,
    pipeGap: 180,
    pipeSpawnRate: 85,
    hasMovingPipes: false,
    isBossLevel: false
  },
  {
    id: 4,
    name: "CYBER GLITCH",
    subtitle: "REALITY DISTORTION DETECTED",
    bgColorTop: '#022c22', // Teal 950
    bgColorBottom: '#064e3b', // Teal 900
    pipeColor: '#065f46', // Teal 800
    pipeBorder: '#34d399', // Teal 400
    pipeSpeed: 5.5,
    pipeGap: 190,
    pipeSpawnRate: 75,
    hasMovingPipes: false,
    isBossLevel: false
  },
  {
    id: 5,
    name: "THE GAUNTLET",
    subtitle: "SURVIVAL PROBABILITY: LOW",
    bgColorTop: '#111827', // Gray 900
    bgColorBottom: '#374151', // Gray 700
    pipeColor: '#1f2937', // Gray 800
    pipeBorder: '#9ca3af', // Gray 400
    pipeSpeed: 6.0,
    pipeGap: 170,
    pipeSpawnRate: 70,
    hasMovingPipes: true,
    isBossLevel: false
  },
  {
    id: 6,
    name: "THE CORE",
    subtitle: "FINAL PROTOCOL",
    bgColorTop: '#450a0a', // Red 950
    bgColorBottom: '#7f1d1d', // Red 900
    pipeColor: '#7f1d1d', // Red 900
    pipeBorder: '#ef4444', // Red 500
    pipeSpeed: 4.5, // Slower for Boss fight
    pipeGap: 220, // Wider for Boss fight
    pipeSpawnRate: 100,
    hasMovingPipes: false,
    isBossLevel: true
  }
];
