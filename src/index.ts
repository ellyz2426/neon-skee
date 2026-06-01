import {
  World, PanelUI, Follower, FollowBehavior, ScreenSpace, PanelDocument, UIKitDocument,
  Mesh, Group, BoxGeometry, SphereGeometry, CylinderGeometry, PlaneGeometry,
  ConeGeometry, TorusGeometry, RingGeometry,
  MeshStandardMaterial, MeshBasicMaterial, LineBasicMaterial,
  Color, Vector3, Quaternion, Euler, Matrix4,
  Fog, AmbientLight, PointLight, DirectionalLight, SpotLight,
  BufferGeometry, Float32BufferAttribute,
  EdgesGeometry, LineSegments,
  AdditiveBlending, DoubleSide, FrontSide,
  InputComponent,
} from '@iwsdk/core';

// ═══════════════════════════════════════════════════
// TYPES & CONSTANTS
// ═══════════════════════════════════════════════════

type GameState = 'title' | 'modeselect' | 'difficulty' | 'countdown' | 'aiming' | 'rolling' | 'scoring' | 'paused' | 'gameover' | 'leaderboard' | 'achievements' | 'settings' | 'help' | 'stats' | 'skins';
type GameMode = 'classic' | 'speedround' | 'target' | 'progressive' | 'daily' | 'practice' | 'tournament';
type Difficulty = 'easy' | 'medium' | 'hard';

interface Ring {
  points: number;
  innerR: number;
  outerR: number;
  color: string;
  label: string;
}

interface Theme {
  name: string;
  grid: string;
  accent: string;
  ring1: string;
  ring2: string;
  ring3: string;
  ring4: string;
  ring5: string;
  pocket: string;
  ball: string;
  lane: string;
  glow: string;
  fog: string;
}

interface Achievement {
  id: string;
  name: string;
  desc: string;
}

interface LeaderboardEntry {
  score: number;
  mode: string;
  difficulty: string;
  accuracy: number;
  date: string;
}

interface BallSkin {
  name: string;
  color: string;
  emissive: string;
  glow: string;
  trail: string;
}

// Lane dimensions
const LANE_LENGTH = 3.0;
const LANE_WIDTH = 0.52;
const LANE_HEIGHT = 0.08;
const RAMP_START = 2.0; // where the ramp begins
const RAMP_END = 3.0;
const RAMP_ANGLE = 0.35; // radians (~20 degrees)
const BUMP_HEIGHT = 0.12;
const LANE_Z = -1.5; // center of lane from player
const LANE_Y = 0.85; // table height

// Scoring board behind the ramp
const BOARD_Z = LANE_Z - LANE_LENGTH / 2 - 0.1;
const BOARD_Y = LANE_Y + 0.9;
const BOARD_RADIUS = 0.55;

// Ring definitions (inner to outer)
const RINGS: Ring[] = [
  { points: 50, innerR: 0, outerR: 0.06, color: '#ff00ff', label: '50' },
  { points: 40, innerR: 0.06, outerR: 0.13, color: '#ffaa00', label: '40' },
  { points: 30, innerR: 0.13, outerR: 0.22, color: '#00ff88', label: '30' },
  { points: 20, innerR: 0.22, outerR: 0.32, color: '#0088ff', label: '20' },
  { points: 10, innerR: 0.32, outerR: 0.45, color: '#00ffff', label: '10' },
];

// Corner pockets: top-left and top-right relative to board center
const POCKET_RADIUS = 0.055;
const POCKET_POINTS = 100;
const POCKET_POSITIONS = [
  { x: -0.32, y: 0.32 },
  { x: 0.32, y: 0.32 },
];

const BALLS_PER_FRAME = 9;

const THEMES: Theme[] = [
  { name: 'Neon Holodeck', grid: '#00ffff', accent: '#ff00ff', ring1: '#ff00ff', ring2: '#ffaa00', ring3: '#00ff88', ring4: '#0088ff', ring5: '#00ffff', pocket: '#ff4400', ball: '#00ffff', lane: '#001122', glow: '#00ffff', fog: '#000811' },
  { name: 'Crimson Arcade', grid: '#ff2222', accent: '#ff8800', ring1: '#ff0044', ring2: '#ff6600', ring3: '#ffaa00', ring4: '#ff2222', ring5: '#ff4466', pocket: '#ffdd00', ball: '#ff4444', lane: '#110000', glow: '#ff2222', fog: '#0a0000' },
  { name: 'Toxic Neon', grid: '#00ff44', accent: '#aaff00', ring1: '#00ff88', ring2: '#aaff00', ring3: '#88ff00', ring4: '#00ff44', ring5: '#44ff88', pocket: '#ffff00', ball: '#44ff44', lane: '#001100', glow: '#00ff44', fog: '#000800' },
  { name: 'Ultra Violet', grid: '#8800ff', accent: '#ff00ff', ring1: '#cc00ff', ring2: '#8800ff', ring3: '#aa44ff', ring4: '#6600cc', ring5: '#bb66ff', pocket: '#ff44ff', ball: '#aa44ff', lane: '#0a0022', glow: '#8800ff', fog: '#040011' },
  { name: 'Solar Blaze', grid: '#ff8800', accent: '#ffdd00', ring1: '#ff4400', ring2: '#ff8800', ring3: '#ffaa00', ring4: '#ffcc00', ring5: '#ffdd44', pocket: '#ff0000', ball: '#ffaa00', lane: '#110800', glow: '#ff8800', fog: '#080400' },
];

const BALL_SKINS: BallSkin[] = [
  { name: 'Neon Cyan', color: '#00ffff', emissive: '#004444', glow: '#00ffff', trail: '#00ffff' },
  { name: 'Solar Flare', color: '#ff8800', emissive: '#442200', glow: '#ff8800', trail: '#ff8800' },
  { name: 'Plasma Pink', color: '#ff44ff', emissive: '#440044', glow: '#ff44ff', trail: '#ff44ff' },
  { name: 'Ice Crystal', color: '#88ccff', emissive: '#223344', glow: '#88ccff', trail: '#88ccff' },
  { name: 'Toxic Green', color: '#44ff44', emissive: '#114411', glow: '#44ff44', trail: '#44ff44' },
  { name: 'Void Purple', color: '#8844ff', emissive: '#221144', glow: '#8844ff', trail: '#8844ff' },
  { name: 'Chrome Silver', color: '#cccccc', emissive: '#333333', glow: '#ffffff', trail: '#cccccc' },
  { name: 'Inferno Red', color: '#ff2222', emissive: '#440000', glow: '#ff2222', trail: '#ff2222' },
];

const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_roll', name: 'First Roll', desc: 'Roll your first ball' },
  { id: 'bullseye', name: 'Bullseye', desc: 'Hit the 50-point center' },
  { id: 'pocket_master', name: 'Pocket Master', desc: 'Hit a 100-point corner pocket' },
  { id: 'score_500', name: 'Half Grand', desc: 'Score 500+ in one frame' },
  { id: 'score_1000', name: 'Grand Score', desc: 'Score 1000+ in one frame' },
  { id: 'perfect_frame', name: 'Perfect Frame', desc: 'Score 900 (all 100s) in one frame' },
  { id: 'streak_3', name: 'Hot Streak', desc: '3 consecutive 50+ hits' },
  { id: 'streak_5', name: 'Fire Streak', desc: '5 consecutive 50+ hits' },
  { id: 'all_rings', name: 'Ring Collector', desc: 'Hit every ring value in one frame' },
  { id: 'no_miss', name: 'No Gutter', desc: 'Complete a frame with no misses' },
  { id: 'speed_500', name: 'Speed Demon', desc: 'Score 500+ in Speed Round' },
  { id: 'target_perfect', name: 'Sharp Eye', desc: 'Perfect score in Target mode' },
  { id: 'progressive_5', name: 'Progressive Pro', desc: 'Clear 5 progressive frames' },
  { id: 'daily_complete', name: 'Daily Player', desc: 'Complete a Daily Challenge' },
  { id: 'tournament_win', name: 'Champion', desc: 'Win a tournament' },
  { id: 'games_10', name: 'Regular', desc: 'Play 10 games' },
  { id: 'games_50', name: 'Dedicated', desc: 'Play 50 games' },
  { id: 'total_10k', name: 'Scorer', desc: 'Accumulate 10,000 career points' },
  { id: 'total_50k', name: 'High Roller', desc: 'Accumulate 50,000 career points' },
  { id: 'combo_x5', name: 'Combo King', desc: 'Reach 5x combo multiplier' },
  { id: 'fashionista', name: 'Fashionista', desc: 'Try 3 different ball skins' },
  { id: 'theme_explorer', name: 'Theme Explorer', desc: 'Try 3 different themes' },
  { id: 'double_pocket', name: 'Double Pocket', desc: 'Hit both corner pockets in one frame' },
  { id: 'gutter_comeback', name: 'Comeback', desc: 'Score 100 after a gutter ball' },
  { id: 'triple_50', name: 'Center Stage', desc: 'Hit three 50-point centers in one frame' },
];

// ═══════════════════════════════════════════════════
// AUDIO MANAGER
// ═══════════════════════════════════════════════════

class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private musicOsc: OscillatorNode | null = null;
  private musicPad: OscillatorNode | null = null;
  private musicLfo: OscillatorNode | null = null;

  init() {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.7;
    this.masterGain.connect(this.ctx.destination);
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.8;
    this.sfxGain.connect(this.masterGain);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.15;
    this.musicGain.connect(this.masterGain);
    this.startAmbient();
  }

  private startAmbient() {
    if (!this.ctx || !this.musicGain) return;
    const c = this.ctx;
    // Base drone
    this.musicOsc = c.createOscillator();
    this.musicOsc.type = 'sine';
    this.musicOsc.frequency.value = 55;
    const droneGain = c.createGain();
    droneGain.gain.value = 0.4;
    this.musicOsc.connect(droneGain);
    droneGain.connect(this.musicGain);
    this.musicOsc.start();
    // Pad
    this.musicPad = c.createOscillator();
    this.musicPad.type = 'triangle';
    this.musicPad.frequency.value = 82.5;
    const padGain = c.createGain();
    padGain.gain.value = 0.2;
    const padFilter = c.createBiquadFilter();
    padFilter.type = 'lowpass';
    padFilter.frequency.value = 400;
    this.musicPad.connect(padFilter);
    padFilter.connect(padGain);
    padGain.connect(this.musicGain);
    this.musicPad.start();
    // LFO
    this.musicLfo = c.createOscillator();
    this.musicLfo.frequency.value = 0.15;
    const lfoGain = c.createGain();
    lfoGain.gain.value = 3;
    this.musicLfo.connect(lfoGain);
    lfoGain.connect(this.musicOsc.frequency);
    this.musicLfo.start();
  }

  private playTone(freq: number, type: OscillatorType, dur: number, vol = 0.3) {
    if (!this.ctx || !this.sfxGain) return;
    const c = this.ctx;
    const o = c.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g);
    g.connect(this.sfxGain);
    o.start();
    o.stop(c.currentTime + dur);
  }

  private playNoise(dur: number, vol = 0.2, freq = 2000) {
    if (!this.ctx || !this.sfxGain) return;
    const c = this.ctx;
    const bufSize = c.sampleRate * dur;
    const buf = c.createBuffer(1, bufSize, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.sfxGain);
    src.start();
  }

  rollSound() { this.playNoise(0.8, 0.15, 800); }
  
  bumpSound() {
    this.playTone(220, 'triangle', 0.15, 0.25);
    this.playNoise(0.1, 0.1, 3000);
  }

  ringHit(points: number) {
    const baseFreq = 300 + points * 6;
    this.playTone(baseFreq, 'sine', 0.3, 0.35);
    this.playTone(baseFreq * 1.5, 'triangle', 0.2, 0.2);
    if (points >= 50) {
      setTimeout(() => this.playTone(baseFreq * 2, 'sine', 0.4, 0.25), 100);
    }
  }

  pocketHit() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((n, i) => {
      setTimeout(() => this.playTone(n, 'sine', 0.4 - i * 0.05, 0.3), i * 80);
    });
  }

  gutterSound() {
    this.playTone(150, 'sawtooth', 0.4, 0.2);
    this.playTone(100, 'sawtooth', 0.5, 0.15);
  }

  chargeSound(power: number) {
    this.playTone(200 + power * 300, 'sine', 0.05, 0.1);
  }

  countdownTick() { this.playTone(880, 'square', 0.08, 0.2); }
  countdownGo() {
    this.playTone(1047, 'square', 0.15, 0.3);
    this.playTone(1319, 'square', 0.15, 0.25);
  }

  gameStart() {
    [523, 659, 784, 1047, 1319].forEach((n, i) => {
      setTimeout(() => this.playTone(n, 'sine', 0.3, 0.25), i * 100);
    });
  }

  gameOver() {
    [784, 659, 523, 392, 330].forEach((n, i) => {
      setTimeout(() => this.playTone(n, 'sawtooth', 0.4, 0.2), i * 120);
    });
  }

  achievementSound() {
    [660, 880, 1047, 1320, 1568].forEach((n, i) => {
      setTimeout(() => this.playTone(n, 'sine', 0.3, 0.2), i * 80);
    });
  }

  buttonClick() { this.playTone(660, 'square', 0.05, 0.15); }
  comboSound(level: number) {
    this.playTone(440 + level * 100, 'triangle', 0.2, 0.25);
  }

  setMasterVolume(v: number) { if (this.masterGain) this.masterGain.gain.value = v; }
  setSfxVolume(v: number) { if (this.sfxGain) this.sfxGain.gain.value = v; }
  setMusicVolume(v: number) { if (this.musicGain) this.musicGain.gain.value = v; }
}

// ═══════════════════════════════════════════════════
// GAME STATE MANAGER
// ═══════════════════════════════════════════════════

class GameStateManager {
  score = 0;
  ballsRemaining = BALLS_PER_FRAME;
  frameNumber = 1;
  totalFrames = 1;
  combo = 0;
  maxCombo = 0;
  comboMultiplier = 1;
  streak = 0;
  maxStreak = 0;
  hits = 0;
  misses = 0;
  rollsThisFrame: number[] = [];
  ringsHitThisFrame = new Set<number>();
  pocketsHitThisFrame = new Set<number>();
  fiftyCount = 0;
  lastScore = 0;
  hadGutter = false;
  mode: GameMode = 'classic';
  difficulty: Difficulty = 'medium';
  themeIndex = 0;
  skinIndex = 0;
  power = 0;
  aimX = 0;
  charging = false;
  timeRemaining = 60;
  targetRing = -1;
  progressiveLevel = 1;
  tournamentRound = 0;
  tournamentScores: number[] = [];
  tournamentAIScores: number[] = [];

  // Persistent data
  private _achievements: Set<string>;
  private _leaderboard: LeaderboardEntry[];
  private _stats: { games: number; totalScore: number; bestScore: number; totalRolls: number; totalHits: number; bestCombo: number; skinsUsed: Set<string>; themesUsed: Set<string>; pocketHits: number; fiftyHits: number; dailyPlayed: number; };
  masterVol = 0.7; sfxVol = 0.8; musicVol = 0.15;

  constructor() {
    this._achievements = new Set(JSON.parse(localStorage.getItem('skee_achievements') || '[]'));
    this._leaderboard = JSON.parse(localStorage.getItem('skee_leaderboard') || '[]');
    const savedStats = JSON.parse(localStorage.getItem('skee_stats') || 'null');
    this._stats = savedStats ? { ...savedStats, skinsUsed: new Set(savedStats.skinsUsed || []), themesUsed: new Set(savedStats.themesUsed || []) } : {
      games: 0, totalScore: 0, bestScore: 0, totalRolls: 0, totalHits: 0, bestCombo: 0,
      skinsUsed: new Set<string>(), themesUsed: new Set<string>(), pocketHits: 0, fiftyHits: 0, dailyPlayed: 0,
    };
    this.themeIndex = parseInt(localStorage.getItem('skee_theme') || '0');
    this.skinIndex = parseInt(localStorage.getItem('skee_skin') || '0');
  }

  get achievements() { return this._achievements; }
  get leaderboard() { return this._leaderboard; }
  get stats() { return this._stats; }
  get accuracy() { return this.hits + this.misses > 0 ? Math.round((this.hits / (this.hits + this.misses)) * 100) : 0; }

  get theme(): Theme { return THEMES[this.themeIndex % THEMES.length]; }
  get skin(): BallSkin { return BALL_SKINS[this.skinIndex % BALL_SKINS.length]; }

  resetFrame() {
    this.score = 0;
    this.ballsRemaining = BALLS_PER_FRAME;
    this.combo = 0;
    this.maxCombo = 0;
    this.comboMultiplier = 1;
    this.streak = 0;
    this.maxStreak = 0;
    this.hits = 0;
    this.misses = 0;
    this.rollsThisFrame = [];
    this.ringsHitThisFrame.clear();
    this.pocketsHitThisFrame.clear();
    this.fiftyCount = 0;
    this.lastScore = 0;
    this.hadGutter = false;
    this.power = 0;
    this.aimX = 0;
    this.charging = false;
  }

  resetGame() {
    this.resetFrame();
    this.frameNumber = 1;
    this.totalFrames = 1;
    this.timeRemaining = 60;
    this.progressiveLevel = 1;
    this.tournamentRound = 0;
    this.tournamentScores = [];
    this.tournamentAIScores = [];
  }

  registerScore(points: number, isPocket = false) {
    const multiplied = points * this.comboMultiplier;
    this.score += multiplied;
    this.lastScore = multiplied;
    this.rollsThisFrame.push(multiplied);
    this.hits++;

    if (isPocket) {
      this.pocketsHitThisFrame.add(points > 0 ? this.pocketsHitThisFrame.size : 0);
      this._stats.pocketHits++;
    }
    if (points === 50) {
      this.fiftyCount++;
      this._stats.fiftyHits++;
    }
    if (points > 0) this.ringsHitThisFrame.add(points);

    // Combo
    if (points >= 50) {
      this.streak++;
      if (this.streak > this.maxStreak) this.maxStreak = this.streak;
    } else {
      this.streak = 0;
    }

    this.combo++;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;
    this.comboMultiplier = this.combo >= 8 ? 5 : this.combo >= 6 ? 3 : this.combo >= 4 ? 2 : 1;
    this._stats.totalHits++;
    this._stats.totalRolls++;
  }

  registerMiss() {
    this.rollsThisFrame.push(0);
    this.misses++;
    this.combo = 0;
    this.comboMultiplier = 1;
    this.streak = 0;
    this.hadGutter = true;
    this._stats.totalRolls++;
  }

  endGame() {
    this._stats.games++;
    this._stats.totalScore += this.score;
    if (this.score > this._stats.bestScore) this._stats.bestScore = this.score;
    if (this.maxCombo > this._stats.bestCombo) this._stats.bestCombo = this.maxCombo;
    this._stats.skinsUsed.add(BALL_SKINS[this.skinIndex].name);
    this._stats.themesUsed.add(THEMES[this.themeIndex].name);
    this.saveStats();
    this.addLeaderboardEntry();
  }

  unlock(id: string): boolean {
    if (this._achievements.has(id)) return false;
    this._achievements.add(id);
    localStorage.setItem('skee_achievements', JSON.stringify([...this._achievements]));
    return true;
  }

  private addLeaderboardEntry() {
    this._leaderboard.push({
      score: this.score, mode: this.mode, difficulty: this.difficulty,
      accuracy: this.accuracy, date: new Date().toLocaleDateString(),
    });
    this._leaderboard.sort((a, b) => b.score - a.score);
    if (this._leaderboard.length > 20) this._leaderboard.length = 20;
    localStorage.setItem('skee_leaderboard', JSON.stringify(this._leaderboard));
  }

  private saveStats() {
    const s = { ...this._stats, skinsUsed: [...this._stats.skinsUsed], themesUsed: [...this._stats.themesUsed] };
    localStorage.setItem('skee_stats', JSON.stringify(s));
  }

  saveTheme() { localStorage.setItem('skee_theme', String(this.themeIndex)); }
  saveSkin() { localStorage.setItem('skee_skin', String(this.skinIndex)); }

  checkAchievements(onUnlock: (a: Achievement) => void) {
    const checks: [string, boolean][] = [
      ['first_roll', this._stats.totalRolls >= 1],
      ['bullseye', this.ringsHitThisFrame.has(50)],
      ['pocket_master', this.pocketsHitThisFrame.size > 0],
      ['score_500', this.score >= 500],
      ['score_1000', this.score >= 1000],
      ['perfect_frame', this.score >= 900 && this.ballsRemaining === 0 && this.mode === 'classic'],
      ['streak_3', this.maxStreak >= 3],
      ['streak_5', this.maxStreak >= 5],
      ['all_rings', this.ringsHitThisFrame.size >= 5],
      ['no_miss', this.misses === 0 && this.ballsRemaining === 0 && this.hits > 0],
      ['speed_500', this.mode === 'speedround' && this.score >= 500],
      ['target_perfect', this.mode === 'target' && this.accuracy === 100 && this.hits >= 5],
      ['progressive_5', this.mode === 'progressive' && this.progressiveLevel >= 5],
      ['daily_complete', this.mode === 'daily'],
      ['tournament_win', this.mode === 'tournament' && this.tournamentRound >= 4],
      ['games_10', this._stats.games >= 10],
      ['games_50', this._stats.games >= 50],
      ['total_10k', this._stats.totalScore >= 10000],
      ['total_50k', this._stats.totalScore >= 50000],
      ['combo_x5', this.maxCombo >= 8],
      ['fashionista', this._stats.skinsUsed.size >= 3],
      ['theme_explorer', this._stats.themesUsed.size >= 3],
      ['double_pocket', this.pocketsHitThisFrame.size >= 2],
      ['gutter_comeback', this.hadGutter && this.lastScore >= 100],
      ['triple_50', this.fiftyCount >= 3],
    ];
    for (const [id, cond] of checks) {
      if (cond && this.unlock(id)) {
        const ach = ACHIEVEMENTS.find(a => a.id === id);
        if (ach) onUnlock(ach);
      }
    }
  }

  getDailyModifiers(): { speedMult: number; ringScale: number; windX: number; ballCount: number } {
    const d = new Date();
    const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    const rng = (s: number) => { let x = Math.sin(s) * 43758.5453; return x - Math.floor(x); };
    return {
      speedMult: 0.8 + rng(seed) * 0.4,
      ringScale: 0.8 + rng(seed + 1) * 0.4,
      windX: (rng(seed + 2) - 0.5) * 0.3,
      ballCount: 7 + Math.floor(rng(seed + 3) * 5),
    };
  }

  getTargetRing(): number {
    const available = [10, 20, 30, 40, 50, 100];
    return available[Math.floor(Math.random() * available.length)];
  }

  getAIScore(): number {
    const base = this.difficulty === 'easy' ? 250 : this.difficulty === 'medium' ? 400 : 550;
    return base + Math.floor(Math.random() * 200);
  }
}

// ═══════════════════════════════════════════════════
// MAIN GAME
// ═══════════════════════════════════════════════════

async function main() {
  const container = document.getElementById('app') as HTMLDivElement;

  const world = await World.create(container, {
    xr: { offer: 'once' as any },
    input: { canvasPointerEvents: true },
    features: {
      grabbing: true,
      locomotion: { browserControls: true } as any,
      physics: false,
      spatialUI: true,
    },
    render: {
      near: 0.01,
      far: 200,
      camera: { position: [0, 1.6, 0.5], lookAt: [0, 1.2, -2] },
    },
  } as any);

  const audio = new AudioManager();
  const gsm = new GameStateManager();
  let gameState: GameState = 'title';
  let prevState: GameState = 'title';

  // ═══ LANE GEOMETRY ═══
  const laneGroup = new Group();
  world.scene.add(laneGroup);

  function buildLane() {
    while (laneGroup.children.length) laneGroup.remove(laneGroup.children[0]);
    const t = gsm.theme;
    const laneMat = new MeshStandardMaterial({ color: new Color(t.lane), emissive: new Color(t.grid), emissiveIntensity: 0.05, metalness: 0.7, roughness: 0.3 });
    const accentMat = new MeshBasicMaterial({ color: new Color(t.accent) });
    const glowMat = new MeshBasicMaterial({ color: new Color(t.glow), transparent: true, opacity: 0.6 });

    // Flat lane section
    const flatGeo = new BoxGeometry(LANE_WIDTH, LANE_HEIGHT, RAMP_START);
    const flatLane = new Mesh(flatGeo, laneMat);
    flatLane.position.set(0, LANE_Y - LANE_HEIGHT / 2, LANE_Z + LANE_LENGTH / 2 - RAMP_START / 2);
    laneGroup.add(flatLane);

    // Lane edge wireframe
    const flatEdge = new LineSegments(new EdgesGeometry(flatGeo), new LineBasicMaterial({ color: new Color(t.grid) }));
    flatEdge.position.copy(flatLane.position);
    laneGroup.add(flatEdge);

    // Ramp section (rotated)
    const rampLen = LANE_LENGTH - RAMP_START;
    const rampGeo = new BoxGeometry(LANE_WIDTH, LANE_HEIGHT, rampLen);
    const ramp = new Mesh(rampGeo, laneMat);
    const rampCenterZ = LANE_Z + LANE_LENGTH / 2 - RAMP_START - rampLen / 2;
    const rampCenterY = LANE_Y - LANE_HEIGHT / 2 + Math.sin(RAMP_ANGLE) * rampLen / 2;
    ramp.position.set(0, rampCenterY, rampCenterZ);
    ramp.rotation.x = -RAMP_ANGLE;
    laneGroup.add(ramp);
    const rampEdge = new LineSegments(new EdgesGeometry(rampGeo), new LineBasicMaterial({ color: new Color(t.grid) }));
    rampEdge.position.copy(ramp.position);
    rampEdge.rotation.copy(ramp.rotation);
    laneGroup.add(rampEdge);

    // Bump at end of ramp
    const bumpGeo = new BoxGeometry(LANE_WIDTH * 0.9, BUMP_HEIGHT, 0.06);
    const bump = new Mesh(bumpGeo, new MeshStandardMaterial({ color: new Color(t.accent), emissive: new Color(t.accent), emissiveIntensity: 0.3 }));
    const bumpZ = LANE_Z + LANE_LENGTH / 2 - LANE_LENGTH + 0.05;
    const bumpY = LANE_Y + Math.sin(RAMP_ANGLE) * rampLen;
    bump.position.set(0, bumpY + BUMP_HEIGHT / 2, bumpZ);
    laneGroup.add(bump);

    // Rails
    const railGeo = new BoxGeometry(0.02, 0.06, LANE_LENGTH);
    const railMatL = new MeshBasicMaterial({ color: new Color(t.grid), transparent: true, opacity: 0.8 });
    for (const side of [-1, 1]) {
      const rail = new Mesh(railGeo, railMatL);
      rail.position.set(side * LANE_WIDTH / 2, LANE_Y + 0.02, LANE_Z);
      laneGroup.add(rail);
    }

    // Scoring board backdrop
    const boardGeo = new CylinderGeometry(BOARD_RADIUS + 0.05, BOARD_RADIUS + 0.05, 0.03, 32);
    const boardMat = new MeshStandardMaterial({ color: new Color('#111111'), emissive: new Color(t.grid), emissiveIntensity: 0.02, metalness: 0.8, roughness: 0.2 });
    const board = new Mesh(boardGeo, boardMat);
    board.position.set(0, BOARD_Y, BOARD_Z);
    board.rotation.x = Math.PI / 2;
    laneGroup.add(board);

    // Scoring rings
    RINGS.forEach((ring, i) => {
      const ringColors = [t.ring1, t.ring2, t.ring3, t.ring4, t.ring5];
      const ringGeo = new TorusGeometry((ring.innerR + ring.outerR) / 2, (ring.outerR - ring.innerR) / 2, 8, 32);
      const ringMesh = new Mesh(ringGeo, new MeshBasicMaterial({ color: new Color(ringColors[i] || t.accent), transparent: true, opacity: 0.7 }));
      ringMesh.position.set(0, BOARD_Y, BOARD_Z + 0.02);
      ringMesh.rotation.x = Math.PI / 2;
      laneGroup.add(ringMesh);

      // Ring glow
      const glowRing = new Mesh(
        new TorusGeometry((ring.innerR + ring.outerR) / 2, (ring.outerR - ring.innerR) / 2 + 0.01, 8, 32),
        new MeshBasicMaterial({ color: new Color(ringColors[i] || t.accent), transparent: true, opacity: 0.2, blending: AdditiveBlending })
      );
      glowRing.position.copy(ringMesh.position);
      glowRing.position.z += 0.01;
      glowRing.rotation.x = Math.PI / 2;
      laneGroup.add(glowRing);
    });

    // Center bullseye sphere
    const bullseye = new Mesh(new SphereGeometry(0.04, 16, 16), new MeshBasicMaterial({ color: new Color(t.ring1), transparent: true, opacity: 0.9 }));
    bullseye.position.set(0, BOARD_Y, BOARD_Z + 0.03);
    laneGroup.add(bullseye);

    // Corner pockets
    POCKET_POSITIONS.forEach(pp => {
      const pocketGeo = new CylinderGeometry(POCKET_RADIUS, POCKET_RADIUS, 0.04, 16);
      const pocketMesh = new Mesh(pocketGeo, new MeshBasicMaterial({ color: new Color(t.pocket), transparent: true, opacity: 0.8 }));
      pocketMesh.position.set(pp.x, BOARD_Y + pp.y, BOARD_Z + 0.02);
      pocketMesh.rotation.x = Math.PI / 2;
      laneGroup.add(pocketMesh);

      // Pocket glow
      const pGlow = new Mesh(
        new SphereGeometry(POCKET_RADIUS + 0.02, 8, 8),
        new MeshBasicMaterial({ color: new Color(t.pocket), transparent: true, opacity: 0.3, blending: AdditiveBlending })
      );
      pGlow.position.copy(pocketMesh.position);
      laneGroup.add(pGlow);
    });

    // Score labels using small spheres as markers
    RINGS.forEach((ring, i) => {
      const labelR = (ring.innerR + ring.outerR) / 2;
      const marker = new Mesh(new SphereGeometry(0.01, 4, 4), new MeshBasicMaterial({ color: new Color('#ffffff') }));
      marker.position.set(labelR, BOARD_Y, BOARD_Z + 0.04);
      laneGroup.add(marker);
    });

    // Board frame ring
    const frameGeo = new TorusGeometry(BOARD_RADIUS + 0.02, 0.015, 8, 48);
    const frameMesh = new Mesh(frameGeo, new MeshBasicMaterial({ color: new Color(t.accent), transparent: true, opacity: 0.8 }));
    frameMesh.position.set(0, BOARD_Y, BOARD_Z + 0.01);
    frameMesh.rotation.x = Math.PI / 2;
    laneGroup.add(frameMesh);

    // Lane center line
    const lineGeo = new BoxGeometry(0.005, 0.002, LANE_LENGTH);
    const lineMesh = new Mesh(lineGeo, glowMat);
    lineMesh.position.set(0, LANE_Y + 0.01, LANE_Z);
    laneGroup.add(lineMesh);

    // Spotlight on scoring board
    const boardLight = new SpotLight(new Color(t.glow) as any, 2, 5, Math.PI / 4, 0.5);
    boardLight.position.set(0, BOARD_Y + 1, BOARD_Z + 0.5);
    boardLight.target.position.set(0, BOARD_Y, BOARD_Z);
    laneGroup.add(boardLight);
    laneGroup.add(boardLight.target);
  }

  // ═══ BALL ═══
  let ball: Mesh | null = null;
  let ballGlow: Mesh | null = null;
  let ballVelocity = new Vector3();
  let ballActive = false;
  let ballPhase: 'rolling' | 'flying' | 'landed' = 'rolling';
  const ballTrail: { pos: Vector3; age: number }[] = [];
  const trailMeshes: Mesh[] = [];
  const MAX_TRAIL = 30;

  function createBall() {
    if (ball) { world.scene.remove(ball); world.scene.remove(ballGlow!); }
    const skin = gsm.skin;
    ball = new Mesh(
      new SphereGeometry(0.03, 16, 16),
      new MeshStandardMaterial({ color: new Color(skin.color), emissive: new Color(skin.emissive), emissiveIntensity: 0.5, metalness: 0.6, roughness: 0.3 })
    );
    // Edge wireframe
    const edges = new LineSegments(new EdgesGeometry(ball.geometry), new LineBasicMaterial({ color: new Color(skin.color) }));
    ball.add(edges);
    // Glow sphere
    ballGlow = new Mesh(
      new SphereGeometry(0.06, 8, 8),
      new MeshBasicMaterial({ color: new Color(skin.glow), transparent: true, opacity: 0.25, blending: AdditiveBlending })
    );
    ball.add(ballGlow);
    resetBallPosition();
    world.scene.add(ball);
    ballActive = false;
    ballPhase = 'rolling';
    ballTrail.length = 0;
  }

  function resetBallPosition() {
    if (!ball) return;
    ball.position.set(gsm.aimX * 0.15, LANE_Y + 0.04, LANE_Z + LANE_LENGTH / 2 - 0.15);
    ballVelocity.set(0, 0, 0);
  }

  // ═══ BALL PHYSICS ═══
  function updateBall(dt: number) {
    if (!ball || !ballActive) return;
    const steps = 4;
    const subDt = dt / steps;

    for (let s = 0; s < steps; s++) {
      const pos = ball.position;

      if (ballPhase === 'rolling') {
        // Rolling along lane surface
        pos.x += ballVelocity.x * subDt;
        pos.z += ballVelocity.z * subDt;

        // Lane bounds
        const halfW = LANE_WIDTH / 2 - 0.04;
        if (pos.x < -halfW) { pos.x = -halfW; ballVelocity.x *= -0.5; }
        if (pos.x > halfW) { pos.x = halfW; ballVelocity.x *= -0.5; }

        // Determine lane surface height at ball Z position
        const relZ = pos.z - (LANE_Z + LANE_LENGTH / 2);
        let surfaceY = LANE_Y + 0.04;
        if (relZ < -RAMP_START) {
          // On the ramp section
          const rampDist = -relZ - RAMP_START;
          surfaceY = LANE_Y + 0.04 + Math.sin(RAMP_ANGLE) * rampDist;
          // Gravity deceleration along ramp
          ballVelocity.z += Math.sin(RAMP_ANGLE) * 9.81 * subDt * 0.4;
        }
        pos.y = surfaceY;

        // Rolling friction
        ballVelocity.x *= (1 - 1.5 * subDt);
        ballVelocity.z *= (1 - 0.8 * subDt);

        // Ball rotation proportional to velocity
        ball.rotation.x -= ballVelocity.z * subDt * 10;
        ball.rotation.z += ballVelocity.x * subDt * 10;

        // Check if ball reached bump (transition to flying)
        const bumpZ = LANE_Z + LANE_LENGTH / 2 - LANE_LENGTH + 0.1;
        if (pos.z <= bumpZ && ballVelocity.z < 0) {
          const speed = Math.abs(ballVelocity.z);
          // Launch! Convert forward velocity to upward + forward
          const launchAngle = RAMP_ANGLE + 0.5; // Additional bump angle
          ballVelocity.y = speed * Math.sin(launchAngle) * 1.4;
          ballVelocity.z = -speed * Math.cos(launchAngle) * 0.6;
          ballPhase = 'flying';
          audio.bumpSound();
        }

        // Ball fell off the sides or stopped
        if (ballVelocity.z > 0.1 && relZ > 0.2) {
          // Ball rolled backwards off the lane
          landBall(-1);
          return;
        }
        if (Math.abs(ballVelocity.z) < 0.05 && Math.abs(ballVelocity.x) < 0.05 && relZ > -RAMP_START + 0.3) {
          // Ball stopped on flat section
          landBall(-1);
          return;
        }

      } else if (ballPhase === 'flying') {
        // Projectile motion
        ballVelocity.y -= 9.81 * subDt;
        pos.x += ballVelocity.x * subDt;
        pos.y += ballVelocity.y * subDt;
        pos.z += ballVelocity.z * subDt;

        // Daily wind modifier
        if (gsm.mode === 'daily') {
          const mods = gsm.getDailyModifiers();
          ballVelocity.x += mods.windX * subDt;
        }

        // Check if ball reached scoring board plane
        if (pos.z <= BOARD_Z + 0.05) {
          // Determine hit position relative to board center
          const hitX = pos.x;
          const hitY = pos.y - BOARD_Y;
          scoreBall(hitX, hitY);
          return;
        }

        // Ball fell below lane height (missed board entirely)
        if (pos.y < LANE_Y - 0.3) {
          landBall(-1);
          return;
        }

        // Ball went too far sideways
        if (Math.abs(pos.x) > 1.5) {
          landBall(-1);
          return;
        }
      }
    }

    // Trail
    if (ball && ballActive) {
      ballTrail.push({ pos: ball.position.clone(), age: 0 });
      if (ballTrail.length > MAX_TRAIL) ballTrail.shift();
    }
  }

  function scoreBall(hitX: number, hitY: number) {
    // Check corner pockets first
    for (let i = 0; i < POCKET_POSITIONS.length; i++) {
      const pp = POCKET_POSITIONS[i];
      const dx = hitX - pp.x;
      const dy = hitY - pp.y;
      if (Math.sqrt(dx * dx + dy * dy) <= POCKET_RADIUS + 0.02) {
        landBall(POCKET_POINTS, true);
        return;
      }
    }

    // Check rings (inner to outer)
    const dist = Math.sqrt(hitX * hitX + hitY * hitY);
    for (const ring of RINGS) {
      if (dist <= ring.outerR) {
        landBall(ring.points);
        return;
      }
    }

    // Missed all rings (hit board but outside scoring area)
    if (dist <= BOARD_RADIUS) {
      landBall(10); // outer board area still scores 10
    } else {
      landBall(-1); // complete miss
    }
  }

  function landBall(points: number, isPocket = false) {
    ballActive = false;
    ballPhase = 'rolling';

    if (points > 0) {
      gsm.registerScore(points, isPocket);
      if (isPocket) {
        audio.pocketHit();
        spawnParticles(ball!.position.clone(), gsm.theme.pocket, 20);
      } else {
        audio.ringHit(points);
        spawnParticles(ball!.position.clone(), points >= 50 ? gsm.theme.ring1 : points >= 30 ? gsm.theme.ring3 : gsm.theme.ring5, 12);
      }
      if (gsm.combo > 1) audio.comboSound(gsm.combo);
      showToast(`+${points * gsm.comboMultiplier}${gsm.comboMultiplier > 1 ? ' x' + gsm.comboMultiplier : ''}`);
    } else {
      gsm.registerMiss();
      audio.gutterSound();
      showToast('GUTTER');
    }

    gsm.checkAchievements((a) => {
      audio.achievementSound();
      showToast('Achievement: ' + a.name);
    });

    gsm.ballsRemaining--;
    updateHUD();

    // Check if frame is over
    if (gsm.mode === 'speedround') {
      // Speed round: keep going until time runs out
      if (gsm.timeRemaining > 0) {
        setTimeout(() => { if (gameState === 'scoring') { createBall(); gameState = 'aiming'; } }, 500);
      } else {
        setTimeout(() => endRound(), 800);
      }
    } else if (gsm.ballsRemaining <= 0) {
      setTimeout(() => endRound(), 800);
    } else {
      setTimeout(() => {
        if (gameState === 'scoring' || gameState === 'rolling') {
          createBall();
          gameState = 'aiming';
        }
      }, 600);
    }

    gameState = 'scoring';
  }

  function endRound() {
    if (gsm.mode === 'progressive') {
      gsm.progressiveLevel++;
      if (gsm.score >= gsm.progressiveLevel * 200) {
        // Continue to next frame
        gsm.resetFrame();
        gsm.ballsRemaining = BALLS_PER_FRAME;
        gsm.frameNumber++;
        createBall();
        gameState = 'aiming';
        showToast('Level ' + gsm.progressiveLevel + '!');
        return;
      }
    }
    if (gsm.mode === 'tournament') {
      gsm.tournamentScores.push(gsm.score);
      gsm.tournamentAIScores.push(gsm.getAIScore());
      gsm.tournamentRound++;
      if (gsm.tournamentRound < 4) {
        // More rounds
        gsm.resetFrame();
        gsm.ballsRemaining = BALLS_PER_FRAME;
        createBall();
        gameState = 'aiming';
        showToast('Round ' + (gsm.tournamentRound + 1));
        return;
      }
    }
    gsm.endGame();
    gsm.checkAchievements((a) => {
      audio.achievementSound();
      showToast('Achievement: ' + a.name);
    });
    gameState = 'gameover';
    audio.gameOver();
    showUI('gameover');
    updateGameOverPanel();
  }

  // ═══ PARTICLES ═══
  const particles: { mesh: Mesh; vel: Vector3; life: number }[] = [];
  const MAX_PARTICLES = 100;

  function spawnParticles(pos: Vector3, colorStr: string, count: number) {
    const color = new Color(colorStr);
    for (let i = 0; i < count && particles.length < MAX_PARTICLES; i++) {
      const geo = new SphereGeometry(0.008, 4, 4);
      const mat = new MeshBasicMaterial({ color, transparent: true, opacity: 0.9, blending: AdditiveBlending });
      const mesh = new Mesh(geo, mat);
      mesh.position.copy(pos);
      const vel = new Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 2 + 1,
        (Math.random() - 0.5) * 2
      );
      world.scene.add(mesh);
      particles.push({ mesh, vel, life: 1.0 });
    }
  }

  function updateParticles(dt: number) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vel.y -= 4 * dt;
      p.mesh.position.add(p.vel.clone().multiplyScalar(dt));
      p.life -= dt * 1.5;
      (p.mesh.material as MeshBasicMaterial).opacity = Math.max(0, p.life);
      if (p.life <= 0) {
        world.scene.remove(p.mesh);
        particles.splice(i, 1);
      }
    }
  }

  // ═══ TRAIL ═══
  function updateTrail() {
    // Clear old trail meshes
    trailMeshes.forEach(m => world.scene.remove(m));
    trailMeshes.length = 0;
    if (!ballActive || ballTrail.length < 2) return;
    const skin = gsm.skin;
    for (let i = 1; i < ballTrail.length; i++) {
      const opacity = i / ballTrail.length * 0.4;
      const geo = new SphereGeometry(0.005, 4, 4);
      const mat = new MeshBasicMaterial({ color: new Color(skin.trail), transparent: true, opacity, blending: AdditiveBlending });
      const m = new Mesh(geo, mat);
      m.position.copy(ballTrail[i].pos);
      world.scene.add(m);
      trailMeshes.push(m);
    }
  }

  // ═══ ENVIRONMENT ═══
  function buildEnvironment() {
    const t = gsm.theme;
    // Clear existing
    world.scene.fog = new Fog(new Color(t.fog) as any, 5, 25);

    // Grid floor
    const floorGeo = new PlaneGeometry(20, 20, 20, 20);
    const floorMat = new MeshStandardMaterial({ color: new Color('#000000'), emissive: new Color(t.grid), emissiveIntensity: 0.04, wireframe: true });
    const floor = new Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    world.scene.add(floor);

    // Grid ceiling
    const ceiling = new Mesh(floorGeo.clone(), floorMat.clone());
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 4;
    world.scene.add(ceiling);

    // Ambient light
    const ambLight = new AmbientLight(new Color('#222233') as any, 0.5);
    world.scene.add(ambLight);

    // Accent lights
    const light1 = new PointLight(new Color(t.accent) as any, 1.5, 8);
    light1.position.set(-2, 3, -2);
    world.scene.add(light1);
    const light2 = new PointLight(new Color(t.glow) as any, 1.5, 8);
    light2.position.set(2, 3, -1);
    world.scene.add(light2);
    const light3 = new PointLight(new Color(t.ring3) as any, 0.8, 6);
    light3.position.set(0, 2, 1);
    world.scene.add(light3);

    // Floating wireframe decorations
    const shapes = [
      new TorusGeometry(0.3, 0.08, 8, 16),
      new BoxGeometry(0.4, 0.4, 0.4),
      new SphereGeometry(0.25, 8, 8),
      new ConeGeometry(0.2, 0.4, 8),
    ];
    for (let i = 0; i < 14; i++) {
      const geo = shapes[i % shapes.length];
      const mat = new MeshBasicMaterial({ color: new Color(t.grid), wireframe: true, transparent: true, opacity: 0.2 });
      const mesh = new Mesh(geo, mat);
      const angle = (i / 14) * Math.PI * 2;
      const r = 4 + Math.random() * 4;
      mesh.position.set(Math.cos(angle) * r, 1 + Math.random() * 2.5, Math.sin(angle) * r - 2);
      mesh.userData = { rotSpeed: 0.2 + Math.random() * 0.5, bobSpeed: 0.3 + Math.random() * 0.3, bobAmp: 0.1 + Math.random() * 0.15, baseY: mesh.position.y };
      world.scene.add(mesh);
      decorations.push(mesh);
    }

    // Ambient particles
    for (let i = 0; i < 40; i++) {
      const pGeo = new SphereGeometry(0.01, 4, 4);
      const pMat = new MeshBasicMaterial({ color: new Color(t.grid), transparent: true, opacity: 0.3 + Math.random() * 0.3, blending: AdditiveBlending });
      const p = new Mesh(pGeo, pMat);
      p.position.set((Math.random() - 0.5) * 16, Math.random() * 3.5 + 0.3, (Math.random() - 0.5) * 16 - 2);
      p.userData = { driftX: (Math.random() - 0.5) * 0.1, driftY: (Math.random() - 0.5) * 0.05, pulseSpeed: 1 + Math.random() * 2, baseOpacity: (pMat as any).opacity };
      world.scene.add(p);
      ambientParticles.push(p);
    }
  }

  const decorations: Mesh[] = [];
  const ambientParticles: Mesh[] = [];

  function updateDecorations(time: number) {
    decorations.forEach(d => {
      d.rotation.x += d.userData.rotSpeed * 0.016;
      d.rotation.y += d.userData.rotSpeed * 0.012;
      d.position.y = d.userData.baseY + Math.sin(time * d.userData.bobSpeed) * d.userData.bobAmp;
    });
    ambientParticles.forEach(p => {
      p.position.x += p.userData.driftX * 0.016;
      p.position.y += p.userData.driftY * 0.016;
      (p.material as MeshBasicMaterial).opacity = p.userData.baseOpacity + Math.sin(time * p.userData.pulseSpeed) * 0.15;
      if (p.position.x > 8) p.position.x = -8;
      if (p.position.x < -8) p.position.x = 8;
    });
  }

  // ═══ UI PANELS ═══
  const panels: Record<string, any> = {};
  const panelEntities: Record<string, any> = {};

  function createPanel(name: string, config: string, opts: { width: number; height: number; follower?: boolean; screenSpace?: boolean; pos?: [number, number, number] }) {
    const entity = world.createTransformEntity(undefined, { persistent: true });
    entity.addComponent(PanelUI, {
      config: `/ui/${config}.json`,
      maxWidth: opts.width,
      maxHeight: opts.height,
    });
    if (opts.follower) {
      entity.addComponent(Follower, {
        target: (world as any).player?.head || (world as any).playerHeadEntity,
        offsetPosition: opts.pos || [0, -0.1, -0.5],
        behavior: FollowBehavior.PivotY,
        speed: 5,
        tolerance: 0.3,
      });
    } else if (opts.screenSpace) {
      entity.addComponent(ScreenSpace, {
        width: '40vw', height: 'auto',
        bottom: opts.pos ? `${opts.pos[1]}px` : '24px',
        right: opts.pos ? `${opts.pos[0]}px` : '24px',
        zOffset: 0.25,
      });
    } else if (opts.pos) {
      entity.object3D!.position.set(opts.pos[0], opts.pos[1], opts.pos[2]);
    }
    panelEntities[name] = entity;
    entity.object3D!.visible = false;
    return entity;
  }

  // Create all panels
  createPanel('title', 'title', { width: 0.9, height: 0.7, pos: [0, 1.5, -2] });
  createPanel('modeselect', 'modeselect', { width: 0.9, height: 0.8, pos: [0, 1.5, -2] });
  createPanel('difficulty', 'difficulty', { width: 0.7, height: 0.6, pos: [0, 1.5, -2] });
  createPanel('hud', 'hud', { width: 0.35, height: 0.12, follower: true, pos: [0.2, -0.12, -0.5] });
  createPanel('powerbar', 'powerbar', { width: 0.06, height: 0.25, follower: true, pos: [-0.25, -0.05, -0.5] });
  createPanel('pause', 'pause', { width: 0.6, height: 0.5, pos: [0, 1.5, -2] });
  createPanel('gameover', 'gameover', { width: 0.8, height: 0.7, pos: [0, 1.5, -2] });
  createPanel('leaderboard', 'leaderboard', { width: 0.8, height: 0.7, pos: [0, 1.5, -2] });
  createPanel('achievements', 'achievements', { width: 0.9, height: 0.8, pos: [0, 1.5, -2] });
  createPanel('settings', 'settings', { width: 0.7, height: 0.7, pos: [0, 1.5, -2] });
  createPanel('help', 'help', { width: 0.8, height: 0.7, pos: [0, 1.5, -2] });
  createPanel('toast', 'toast', { width: 0.3, height: 0.06, follower: true, pos: [0, 0.1, -0.5] });
  createPanel('countdown', 'countdown', { width: 0.2, height: 0.15, follower: true, pos: [0, 0, -0.5] });
  createPanel('stats', 'stats', { width: 0.8, height: 0.7, pos: [0, 1.5, -2] });
  createPanel('skins', 'skins', { width: 0.8, height: 0.6, pos: [0, 1.5, -2] });

  // Panel visibility management
  function showUI(name: string) {
    const allPanels = ['title', 'modeselect', 'difficulty', 'pause', 'gameover', 'leaderboard', 'achievements', 'settings', 'help', 'stats', 'skins'];
    allPanels.forEach(p => {
      if (panelEntities[p]?.object3D) panelEntities[p].object3D.visible = (p === name);
    });
    // HUD, powerbar, toast, countdown managed separately
  }

  function showHUD(show: boolean) {
    if (panelEntities['hud']?.object3D) panelEntities['hud'].object3D.visible = show;
    if (panelEntities['powerbar']?.object3D) panelEntities['powerbar'].object3D.visible = show;
  }

  // Toast system
  let toastTimer: any = null;
  function showToast(msg: string) {
    if (panelEntities['toast']?.object3D) {
      panelEntities['toast'].object3D.visible = true;
      setText(panelEntities['toast'], 'toast-text', msg);
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(() => {
        if (panelEntities['toast']?.object3D) panelEntities['toast'].object3D.visible = false;
      }, 2000);
    }
  }

  // Helper to set text on PanelUI
  function setText(entity: any, id: string, text: string) {
    const doc = entity?.getValue?.(PanelDocument, 'document') as UIKitDocument | undefined;
    if (!doc) return;
    const el = doc.getElementById(id);
    if (el && (el as any).text) (el as any).text.value = text;
  }

  function setVisible(entity: any, id: string, visible: boolean) {
    const doc = entity?.getValue?.(PanelDocument, 'document') as UIKitDocument | undefined;
    if (!doc) return;
    const el = doc.getElementById(id);
    if (el && (el as any).display) (el as any).display.value = visible ? 'flex' : 'none';
  }

  // ═══ UI UPDATES ═══
  function updateHUD() {
    const e = panelEntities['hud'];
    if (!e) return;
    setText(e, 'score-value', String(gsm.score));
    setText(e, 'balls-value', String(gsm.ballsRemaining));
    setText(e, 'combo-value', gsm.comboMultiplier > 1 ? `x${gsm.comboMultiplier}` : '');
    if (gsm.mode === 'speedround') {
      setText(e, 'time-value', String(Math.ceil(gsm.timeRemaining)));
    } else {
      setText(e, 'time-value', '');
    }
    if (gsm.mode === 'target' && gsm.targetRing > 0) {
      setText(e, 'target-value', `Target: ${gsm.targetRing}pts`);
    } else {
      setText(e, 'target-value', '');
    }
  }

  function updatePowerBar() {
    const e = panelEntities['powerbar'];
    if (!e) return;
    const filled = Math.round(gsm.power * 10);
    const bar = '|'.repeat(filled) + '.'.repeat(10 - filled);
    setText(e, 'power-fill', bar);
    const color = gsm.power < 0.5 ? '#00ff88' : gsm.power < 0.8 ? '#ffaa00' : '#ff2222';
    setText(e, 'power-label', gsm.power > 0 ? `${Math.round(gsm.power * 100)}%` : 'AIM');
  }

  function updateGameOverPanel() {
    const e = panelEntities['gameover'];
    if (!e) return;
    setText(e, 'final-score', String(gsm.score));
    setText(e, 'accuracy', `${gsm.accuracy}%`);
    setText(e, 'max-combo', `x${gsm.maxCombo}`);
    setText(e, 'hits-misses', `${gsm.hits} / ${gsm.misses}`);

    if (gsm.mode === 'tournament') {
      const playerTotal = gsm.tournamentScores.reduce((a, b) => a + b, 0);
      const aiTotal = gsm.tournamentAIScores.reduce((a, b) => a + b, 0);
      setText(e, 'tournament-result', playerTotal > aiTotal ? 'YOU WIN!' : playerTotal === aiTotal ? 'DRAW!' : 'CPU WINS');
    } else {
      setText(e, 'tournament-result', '');
    }
  }

  function updateLeaderboardPanel() {
    const e = panelEntities['leaderboard'];
    if (!e) return;
    for (let i = 0; i < 10; i++) {
      const entry = gsm.leaderboard[i];
      if (entry) {
        setText(e, `lb-rank-${i}`, `${i + 1}.`);
        setText(e, `lb-score-${i}`, String(entry.score));
        setText(e, `lb-mode-${i}`, entry.mode.toUpperCase());
        setText(e, `lb-date-${i}`, entry.date);
      } else {
        setText(e, `lb-rank-${i}`, '');
        setText(e, `lb-score-${i}`, '');
        setText(e, `lb-mode-${i}`, '');
        setText(e, `lb-date-${i}`, '');
      }
    }
  }

  function updateAchievementsPanel() {
    const e = panelEntities['achievements'];
    if (!e) return;
    ACHIEVEMENTS.forEach((a, i) => {
      const unlocked = gsm.achievements.has(a.id);
      setText(e, `ach-name-${i}`, `${unlocked ? '[x]' : '[ ]'} ${a.name}`);
      setText(e, `ach-desc-${i}`, a.desc);
    });
  }

  function updateStatsPanel() {
    const e = panelEntities['stats'];
    if (!e) return;
    const s = gsm.stats;
    setText(e, 'stat-games', String(s.games));
    setText(e, 'stat-total', String(s.totalScore));
    setText(e, 'stat-best', String(s.bestScore));
    setText(e, 'stat-rolls', String(s.totalRolls));
    setText(e, 'stat-hits', String(s.totalHits));
    setText(e, 'stat-accuracy', s.totalRolls > 0 ? `${Math.round(s.totalHits / s.totalRolls * 100)}%` : '-');
    setText(e, 'stat-combo', String(s.bestCombo));
    setText(e, 'stat-pockets', String(s.pocketHits));
    setText(e, 'stat-fifties', String(s.fiftyHits));
  }

  function updateSkinsPanel() {
    const e = panelEntities['skins'];
    if (!e) return;
    BALL_SKINS.forEach((sk, i) => {
      setText(e, `skin-name-${i}`, `${i === gsm.skinIndex ? '> ' : '  '}${sk.name}`);
    });
  }

  function updateSettingsPanel() {
    const e = panelEntities['settings'];
    if (!e) return;
    setText(e, 'theme-name', gsm.theme.name);
    setText(e, 'master-vol', `${Math.round(gsm.masterVol * 100)}%`);
    setText(e, 'sfx-vol', `${Math.round(gsm.sfxVol * 100)}%`);
    setText(e, 'music-vol', `${Math.round(gsm.musicVol * 100)}%`);
  }

  // ═══ UI EVENT BINDING ═══
  let uiBound = false;
  function bindUIEvents() {
    if (uiBound) return;
    uiBound = true;

    // Retry binding periodically since PanelUI loads async
    const bind = () => {
      // Title
      bindBtn('title', 'btn-play', () => { audio.init(); audio.buttonClick(); gameState = 'modeselect'; showUI('modeselect'); });
      bindBtn('title', 'btn-leaderboard', () => { audio.buttonClick(); gameState = 'leaderboard'; showUI('leaderboard'); updateLeaderboardPanel(); });
      bindBtn('title', 'btn-achievements', () => { audio.buttonClick(); gameState = 'achievements'; showUI('achievements'); updateAchievementsPanel(); });
      bindBtn('title', 'btn-settings', () => { audio.buttonClick(); gameState = 'settings'; showUI('settings'); updateSettingsPanel(); });
      bindBtn('title', 'btn-help', () => { audio.buttonClick(); gameState = 'help'; showUI('help'); });
      bindBtn('title', 'btn-stats', () => { audio.buttonClick(); gameState = 'stats'; showUI('stats'); updateStatsPanel(); });
      bindBtn('title', 'btn-skins', () => { audio.buttonClick(); gameState = 'skins'; showUI('skins'); updateSkinsPanel(); });

      // Mode select
      bindBtn('modeselect', 'btn-classic', () => { audio.buttonClick(); gsm.mode = 'classic'; gameState = 'difficulty'; showUI('difficulty'); });
      bindBtn('modeselect', 'btn-speed', () => { audio.buttonClick(); gsm.mode = 'speedround'; gameState = 'difficulty'; showUI('difficulty'); });
      bindBtn('modeselect', 'btn-target', () => { audio.buttonClick(); gsm.mode = 'target'; gameState = 'difficulty'; showUI('difficulty'); });
      bindBtn('modeselect', 'btn-progressive', () => { audio.buttonClick(); gsm.mode = 'progressive'; gameState = 'difficulty'; showUI('difficulty'); });
      bindBtn('modeselect', 'btn-daily', () => { audio.buttonClick(); gsm.mode = 'daily'; gsm.difficulty = 'medium'; startGame(); });
      bindBtn('modeselect', 'btn-practice', () => { audio.buttonClick(); gsm.mode = 'practice'; gsm.difficulty = 'easy'; startGame(); });
      bindBtn('modeselect', 'btn-tournament', () => { audio.buttonClick(); gsm.mode = 'tournament'; gameState = 'difficulty'; showUI('difficulty'); });
      bindBtn('modeselect', 'btn-back-mode', () => { audio.buttonClick(); gameState = 'title'; showUI('title'); });

      // Difficulty
      bindBtn('difficulty', 'btn-easy', () => { audio.buttonClick(); gsm.difficulty = 'easy'; startGame(); });
      bindBtn('difficulty', 'btn-medium', () => { audio.buttonClick(); gsm.difficulty = 'medium'; startGame(); });
      bindBtn('difficulty', 'btn-hard', () => { audio.buttonClick(); gsm.difficulty = 'hard'; startGame(); });

      // Pause
      bindBtn('pause', 'btn-resume', () => { audio.buttonClick(); gameState = prevState; showUI(''); showHUD(true); });
      bindBtn('pause', 'btn-quit', () => { audio.buttonClick(); gameState = 'title'; showUI('title'); showHUD(false); });

      // Game over
      bindBtn('gameover', 'btn-rematch', () => { audio.buttonClick(); startGame(); });
      bindBtn('gameover', 'btn-title', () => { audio.buttonClick(); gameState = 'title'; showUI('title'); showHUD(false); });

      // Back buttons
      bindBtn('leaderboard', 'btn-back-lb', () => { audio.buttonClick(); gameState = 'title'; showUI('title'); });
      bindBtn('achievements', 'btn-back-ach', () => { audio.buttonClick(); gameState = 'title'; showUI('title'); });
      bindBtn('help', 'btn-back-help', () => { audio.buttonClick(); gameState = 'title'; showUI('title'); });
      bindBtn('stats', 'btn-back-stats', () => { audio.buttonClick(); gameState = 'title'; showUI('title'); });
      bindBtn('skins', 'btn-back-skins', () => { audio.buttonClick(); gameState = 'title'; showUI('title'); });

      // Settings
      bindBtn('settings', 'btn-back-settings', () => { audio.buttonClick(); gameState = 'title'; showUI('title'); });
      bindBtn('settings', 'btn-theme-prev', () => { audio.buttonClick(); gsm.themeIndex = (gsm.themeIndex - 1 + THEMES.length) % THEMES.length; gsm.saveTheme(); buildLane(); updateSettingsPanel(); });
      bindBtn('settings', 'btn-theme-next', () => { audio.buttonClick(); gsm.themeIndex = (gsm.themeIndex + 1) % THEMES.length; gsm.saveTheme(); buildLane(); updateSettingsPanel(); });
      bindBtn('settings', 'btn-master-down', () => { gsm.masterVol = Math.max(0, gsm.masterVol - 0.1); audio.setMasterVolume(gsm.masterVol); updateSettingsPanel(); });
      bindBtn('settings', 'btn-master-up', () => { gsm.masterVol = Math.min(1, gsm.masterVol + 0.1); audio.setMasterVolume(gsm.masterVol); updateSettingsPanel(); });
      bindBtn('settings', 'btn-sfx-down', () => { gsm.sfxVol = Math.max(0, gsm.sfxVol - 0.1); audio.setSfxVolume(gsm.sfxVol); updateSettingsPanel(); });
      bindBtn('settings', 'btn-sfx-up', () => { gsm.sfxVol = Math.min(1, gsm.sfxVol + 0.1); audio.setSfxVolume(gsm.sfxVol); updateSettingsPanel(); });
      bindBtn('settings', 'btn-music-down', () => { gsm.musicVol = Math.max(0, gsm.musicVol - 0.1); audio.setMusicVolume(gsm.musicVol); updateSettingsPanel(); });
      bindBtn('settings', 'btn-music-up', () => { gsm.musicVol = Math.min(1, gsm.musicVol + 0.1); audio.setMusicVolume(gsm.musicVol); updateSettingsPanel(); });

      // Skins
      BALL_SKINS.forEach((_, i) => {
        bindBtn('skins', `btn-skin-${i}`, () => { audio.buttonClick(); gsm.skinIndex = i; gsm.saveSkin(); updateSkinsPanel(); });
      });
    };

    // Try binding now and again after a short delay for panel load
    bind();
    setTimeout(bind, 500);
    setTimeout(bind, 1500);
    setTimeout(bind, 3000);
  }

  function bindBtn(panelName: string, btnId: string, callback: () => void) {
    const entity = panelEntities[panelName];
    if (!entity) return;
    const doc = entity.getValue?.(PanelDocument, 'document') as UIKitDocument | undefined;
    if (!doc) return;
    const btn = doc.getElementById(btnId);
    if (btn) {
      btn.addEventListener('click', callback);
    }
  }

  // ═══ GAME FLOW ═══
  function startGame() {
    audio.init();
    gsm.resetGame();

    // Mode-specific setup
    if (gsm.mode === 'speedround') {
      gsm.timeRemaining = gsm.difficulty === 'easy' ? 90 : gsm.difficulty === 'medium' ? 60 : 45;
      gsm.ballsRemaining = 999;
    } else if (gsm.mode === 'daily') {
      const mods = gsm.getDailyModifiers();
      gsm.ballsRemaining = mods.ballCount;
    } else if (gsm.mode === 'target') {
      gsm.targetRing = gsm.getTargetRing();
    } else if (gsm.mode === 'practice') {
      gsm.ballsRemaining = 999;
    }

    showUI('');
    showHUD(true);
    createBall();
    startCountdown();
  }

  let countdownVal = 3;
  function startCountdown() {
    gameState = 'countdown';
    countdownVal = 3;
    if (panelEntities['countdown']?.object3D) panelEntities['countdown'].object3D.visible = true;
    setText(panelEntities['countdown'], 'countdown-text', '3');
    audio.countdownTick();

    const tick = () => {
      countdownVal--;
      if (countdownVal > 0) {
        setText(panelEntities['countdown'], 'countdown-text', String(countdownVal));
        audio.countdownTick();
        setTimeout(tick, 1000);
      } else {
        setText(panelEntities['countdown'], 'countdown-text', 'ROLL!');
        audio.countdownGo();
        audio.gameStart();
        setTimeout(() => {
          if (panelEntities['countdown']?.object3D) panelEntities['countdown'].object3D.visible = false;
          gameState = 'aiming';
          updateHUD();
        }, 500);
      }
    };
    setTimeout(tick, 1000);
  }

  // ═══ INPUT ═══
  let mouseDown = false;
  let chargeStart = 0;

  // Browser input
  container.addEventListener('mousedown', (e) => {
    if (gameState !== 'aiming') return;
    audio.init();
    mouseDown = true;
    chargeStart = performance.now();
    gsm.charging = true;
    gsm.power = 0;
  });

  container.addEventListener('mousemove', (e) => {
    if (gameState === 'aiming') {
      // Map mouse X to aim direction (-1 to 1)
      const rect = container.getBoundingClientRect();
      gsm.aimX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      if (ball && !ballActive) {
        resetBallPosition();
      }
    }
  });

  container.addEventListener('mouseup', (e) => {
    if (!mouseDown || gameState !== 'aiming') { mouseDown = false; return; }
    mouseDown = false;
    gsm.charging = false;
    rollBall();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (gameState === 'aiming' || gameState === 'rolling' || gameState === 'scoring') {
        prevState = gameState;
        gameState = 'paused';
        showUI('pause');
        showHUD(false);
      } else if (gameState === 'paused') {
        gameState = prevState;
        showUI('');
        showHUD(true);
      }
    }
    if (e.key === 'r' || e.key === 'R') {
      if (gameState === 'gameover') startGame();
    }
  });

  function rollBall() {
    if (!ball || ballActive || gameState !== 'aiming') return;
    ballActive = true;
    gameState = 'rolling';

    // Calculate velocity from power and aim
    let speed = gsm.power * 6 + 2; // min 2, max 8 m/s

    // Difficulty affects ball physics
    if (gsm.difficulty === 'easy') speed *= 0.9;
    if (gsm.difficulty === 'hard') speed *= 1.1;

    // Progressive difficulty increases speed requirement
    if (gsm.mode === 'progressive') {
      speed *= (1 - gsm.progressiveLevel * 0.02);
    }

    // Daily modifiers
    if (gsm.mode === 'daily') {
      speed *= gsm.getDailyModifiers().speedMult;
    }

    const aimAngle = gsm.aimX * 0.15; // Slight lateral angle
    ballVelocity.set(Math.sin(aimAngle) * speed * 0.3, 0, -speed);
    ballTrail.length = 0;
    audio.rollSound();
    gsm.power = 0;
    updatePowerBar();
  }

  // ═══ GAME LOOP ═══
  let lastTime = performance.now();
  let totalTime = 0;

  function gameLoop() {
    requestAnimationFrame(gameLoop);
    const now = performance.now();
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    totalTime += dt;

    // Charge power while held
    if (gsm.charging && gameState === 'aiming') {
      gsm.power = Math.min(1, (now - chargeStart) / 1500);
      updatePowerBar();
      if (Math.random() < 0.3) audio.chargeSound(gsm.power);
    }

    // XR controller input
    const rightGamepad = (world.input as any).xr?.gamepads?.right;
    if (rightGamepad) {
      const triggerDown = rightGamepad.getButtonDown?.(InputComponent.Trigger);
      const triggerUp = rightGamepad.getButtonUp?.(InputComponent.Trigger);
      const bDown = rightGamepad.getButtonDown?.(InputComponent.B_Button);
      const thumbstick = rightGamepad.getAxesValues?.(InputComponent.Thumbstick);

      if (triggerDown && gameState === 'aiming') {
        audio.init();
        chargeStart = performance.now();
        gsm.charging = true;
        gsm.power = 0;
      }
      if (triggerUp && gsm.charging && gameState === 'aiming') {
        gsm.charging = false;
        rollBall();
      }
      if (bDown) {
        if (gameState === 'aiming' || gameState === 'rolling' || gameState === 'scoring') {
          prevState = gameState;
          gameState = 'paused';
          showUI('pause');
          showHUD(false);
        } else if (gameState === 'paused') {
          gameState = prevState;
          showUI('');
          showHUD(true);
        }
      }
      if (thumbstick && gameState === 'aiming') {
        gsm.aimX = Math.max(-1, Math.min(1, gsm.aimX + thumbstick.x * dt * 2));
        if (ball && !ballActive) resetBallPosition();
      }
    }

    // Update ball physics
    if (ballActive) updateBall(dt);

    // Speed round timer
    if (gsm.mode === 'speedround' && (gameState === 'aiming' || gameState === 'rolling' || gameState === 'scoring')) {
      gsm.timeRemaining -= dt;
      if (gsm.timeRemaining <= 0) {
        gsm.timeRemaining = 0;
        if (gameState === 'aiming') endRound();
      }
      updateHUD();
    }

    // Update visuals
    updateParticles(dt);
    updateTrail();
    updateDecorations(totalTime);

    // Bind UI events (retries until panels load)
    bindUIEvents();
  }

  // ═══ INIT ═══
  buildEnvironment();
  buildLane();
  showUI('title');
  showHUD(false);
  gameLoop();
}

main().catch(console.error);
