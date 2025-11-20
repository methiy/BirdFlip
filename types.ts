
export enum GameState {
  START = 'START',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY'
}

export interface Bird {
  x: number;
  y: number;
  velocity: number;
  radius: number;
  rotation: number;
  hasShield: boolean;
}

export interface Pipe {
  x: number;
  topHeight: number;
  originalTopHeight: number;
  width: number;
  passed: boolean;
  isMoving: boolean;
  moveOffset: number;
}

export interface FloatingLetter {
  id: string;
  x: number;
  y: number;
  char: string;
  collected: boolean;
  oscillationOffset: number;
}

export type PowerUpType = 'SHIELD' | 'AMMO' | 'SPLIT' | 'LASER' | 'BOOMERANG';

export interface PowerUp {
  id: string;
  x: number;
  y: number;
  type: PowerUpType;
  collected: boolean;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  brightness: number;
}

export interface Boss {
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  oscillationOffset: number;
  isHit: number; // Frames to show hit flash
  attackTimer: number;
  phase: 1 | 2 | 3;
}

export type ProjectileType = 'STANDARD' | 'LASER' | 'BOOMERANG' | 'ENEMY_BOLT' | 'SPLIT';

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: ProjectileType;
  damage: number;
  active: boolean;
  // For homing
  targetX?: number;
  targetY?: number;
  // For boomerang
  returnState?: 'OUT' | 'RETURN'; 
  returnSpeed?: number;
}