
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

// Boss Mechanics (Base values, overridden by LevelConfig)
export const BOSS_WIDTH_BASE = 100;
export const BOSS_HEIGHT_BASE = 100;

// Projectiles
export const PROJECTILE_SPEED_STANDARD = 12;
export const PROJECTILE_SPEED_LASER = 25;
export const PROJECTILE_SPEED_BOOMERANG = 9;
export const PROJECTILE_SPEED_ENEMY = 7;

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
    subtitle: "THREAT: SENTRY DRONE",
    bgColorTop: '#0f172a', // Slate 900
    bgColorBottom: '#1e293b', // Slate 800
    pipeColor: '#334155', // Slate 700
    pipeBorder: '#94a3b8', // Slate 400
    pipeSpeed: 3.5,
    pipeGap: 200,
    pipeSpawnRate: 100,
    hasMovingPipes: false,
    bossConfig: {
      name: "SENTRY ALPHA",
      hp: 15,
      behavior: 'STATIC',
      projectileType: 'ENEMY_BOLT',
      fireRate: 120,
      color: '#64748b',
      width: 80, height: 80
    }
  },
  {
    id: 2,
    name: "NEBULA DRIFT",
    subtitle: "THREAT: GUARDIAN",
    bgColorTop: '#2e1065', // Violet 950
    bgColorBottom: '#4c1d95', // Violet 900
    pipeColor: '#5b21b6', // Violet 800
    pipeBorder: '#a78bfa', // Violet 400
    pipeSpeed: 4.0,
    pipeGap: 190,
    pipeSpawnRate: 90,
    hasMovingPipes: true,
    bossConfig: {
      name: "GUARDIAN MK-II",
      hp: 25,
      behavior: 'SIN_WAVE',
      projectileType: 'ENEMY_BOLT',
      fireRate: 90,
      color: '#8b5cf6',
      width: 100, height: 100
    }
  },
  {
    id: 3,
    name: "SOLAR FLARE",
    subtitle: "THREAT: HUNTER",
    bgColorTop: '#451a03', // Amber 950
    bgColorBottom: '#78350f', // Amber 900
    pipeColor: '#92400e', // Amber 800
    pipeBorder: '#fbbf24', // Amber 400
    pipeSpeed: 4.5,
    pipeGap: 180,
    pipeSpawnRate: 85,
    hasMovingPipes: false,
    bossConfig: {
      name: "SOLAR HUNTER",
      hp: 35,
      behavior: 'TRACKING',
      projectileType: 'SPLIT', // Shoots spread
      fireRate: 100,
      color: '#ea580c',
      width: 90, height: 120
    }
  },
  {
    id: 4,
    name: "CYBER GLITCH",
    subtitle: "THREAT: SNIPER",
    bgColorTop: '#022c22', // Teal 950
    bgColorBottom: '#064e3b', // Teal 900
    pipeColor: '#065f46', // Teal 800
    pipeBorder: '#34d399', // Teal 400
    pipeSpeed: 5.5,
    pipeGap: 190,
    pipeSpawnRate: 75,
    hasMovingPipes: false,
    bossConfig: {
      name: "NULL POINTER",
      hp: 40,
      behavior: 'STATIC',
      projectileType: 'LASER',
      fireRate: 150,
      color: '#14b8a6',
      width: 60, height: 140
    }
  },
  {
    id: 5,
    name: "THE GAUNTLET",
    subtitle: "THREAT: JUGGERNAUT",
    bgColorTop: '#111827', // Gray 900
    bgColorBottom: '#374151', // Gray 700
    pipeColor: '#1f2937', // Gray 800
    pipeBorder: '#9ca3af', // Gray 400
    pipeSpeed: 6.0,
    pipeGap: 170,
    pipeSpawnRate: 70,
    hasMovingPipes: true,
    bossConfig: {
      name: "IRON CLAD",
      hp: 60,
      behavior: 'SIN_WAVE',
      projectileType: 'BOOMERANG',
      fireRate: 80,
      color: '#374151',
      width: 140, height: 140
    }
  },
  {
    id: 6,
    name: "THE CORE",
    subtitle: "THREAT: FINAL PROTOCOL",
    bgColorTop: '#450a0a', // Red 950
    bgColorBottom: '#7f1d1d', // Red 900
    pipeColor: '#7f1d1d', // Red 900
    pipeBorder: '#ef4444', // Red 500
    pipeSpeed: 4.5, 
    pipeGap: 220, 
    pipeSpawnRate: 100,
    hasMovingPipes: false,
    bossConfig: {
      name: "THE CORE",
      hp: 100,
      behavior: 'PHASED',
      projectileType: 'ENEMY_BOLT', // Varies by phase
      fireRate: 30,
      color: '#ef4444',
      width: 120, height: 120
    }
  }
];
