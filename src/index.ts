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

type GameState = 'title' | 'modeselect' | 'difficulty' | 'countdown' | 'aiming' | 'rolling' | 'scoring' | 'paused' | 'gameover' | 'leaderboard' | 'achievements' | 'settings' | 'help' | 'stats' | 'skins' | 'tutorial' | 'season' | 'seasonresult' | 'customsetup' | 'replay' | 'waveintro';
type GameMode = 'classic' | 'speedround' | 'target' | 'progressive' | 'daily' | 'practice' | 'tournament' | 'season' | 'custom' | 'endless';
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

// ═══════════════════════════════════════════════════
// POWER-UPS
// ═══════════════════════════════════════════════════

interface PowerUpDef {
  id: string;
  name: string;
  desc: string;
  color: string;
  duration: number; // seconds, 0 = instant
}

const POWER_UP_DEFS: PowerUpDef[] = [
  { id: 'multiball', name: 'Multi-Ball', desc: 'Launch 3 balls at once', color: '#ff00ff', duration: 0 },
  { id: 'magnet', name: 'Magnet', desc: 'Ball curves toward center', color: '#00ff88', duration: 15 },
  { id: 'bigball', name: 'Big Ball', desc: 'Larger ball, easier hits', color: '#ffaa00', duration: 15 },
  { id: 'scoreboost', name: 'Score ×2', desc: 'All scores doubled', color: '#ff4400', duration: 20 },
  { id: 'ghost', name: 'Ghost Ball', desc: 'Ball passes through for multi-hits', color: '#8844ff', duration: 0 },
];

// ═══════════════════════════════════════════════════
// SEASON / CAMPAIGN
// ═══════════════════════════════════════════════════

interface SeasonStage {
  name: string;
  desc: string;
  balls: number;
  targetScore: number;
  modifiers: { speedMult?: number; ringScale?: number; windX?: number; gravity?: number };
  powerUpChance: number;
}

const SEASON_STAGES: SeasonStage[] = [
  { name: 'Rookie Lane', desc: 'Warm up! Score 200 for 3 stars.', balls: 9, targetScore: 200, modifiers: {}, powerUpChance: 0.2 },
  { name: 'Neon Alley', desc: 'Rings are tighter.', balls: 9, targetScore: 300, modifiers: { ringScale: 0.85 }, powerUpChance: 0.2 },
  { name: 'Wind Tunnel', desc: 'Crosswind pushes your ball.', balls: 9, targetScore: 350, modifiers: { windX: 0.15 }, powerUpChance: 0.25 },
  { name: 'Speed Demon', desc: 'Balls roll faster!', balls: 9, targetScore: 400, modifiers: { speedMult: 1.25 }, powerUpChance: 0.25 },
  { name: 'Shrunken Board', desc: 'Smaller rings demand precision.', balls: 9, targetScore: 350, modifiers: { ringScale: 0.7 }, powerUpChance: 0.3 },
  { name: 'Heavy Gravity', desc: 'Higher gravity pulls balls down.', balls: 9, targetScore: 400, modifiers: { gravity: 1.4 }, powerUpChance: 0.3 },
  { name: 'Gale Force', desc: 'Strong wind. Use spin!', balls: 12, targetScore: 500, modifiers: { windX: 0.3, speedMult: 1.1 }, powerUpChance: 0.35 },
  { name: 'Championship', desc: 'Tight rings, fast balls, heavy gravity.', balls: 12, targetScore: 600, modifiers: { ringScale: 0.7, speedMult: 1.3, gravity: 1.3 }, powerUpChance: 0.35 },
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
  // Round 2 achievements
  { id: 'spin_master', name: 'Spin Master', desc: 'Land a curved ball on the center' },
  { id: 'score_1500', name: 'Mega Score', desc: 'Score 1500+ in one frame' },
  { id: 'score_2000', name: 'Legendary', desc: 'Score 2000+ in one frame' },
  { id: 'streak_7', name: 'On Fire', desc: '7 consecutive 50+ hits' },
  { id: 'perfect_accuracy', name: 'Sharpshooter', desc: '100% accuracy in a completed frame' },
  { id: 'speed_1000', name: 'Speed King', desc: 'Score 1000+ in Speed Round' },
  { id: 'tournament_sweep', name: 'Sweep', desc: 'Win every tournament round' },
  { id: 'games_100', name: 'Veteran', desc: 'Play 100 games' },
  { id: 'total_100k', name: 'Legend', desc: 'Accumulate 100,000 career points' },
  { id: 'all_skins', name: 'Collector', desc: 'Try all 8 ball skins' },
  { id: 'all_themes', name: 'Interior Designer', desc: 'Try all 5 arena themes' },
  { id: 'daily_streak_3', name: 'Consistent', desc: 'Complete 3 Daily Challenges' },
  { id: 'progressive_10', name: 'Endurance', desc: 'Clear 10 progressive frames' },
  { id: 'triple_pocket', name: 'Pocket Ace', desc: 'Hit 3 pocket shots in one frame' },
  { id: 'no_miss_hard', name: 'Perfectionist', desc: 'No misses on Hard difficulty' },
  // Round 3 achievements
  { id: 'powerup_collect', name: 'Powered Up', desc: 'Collect your first power-up' },
  { id: 'powerup_all', name: 'Full Arsenal', desc: 'Use all 5 power-up types' },
  { id: 'multiball_hit', name: 'Triple Threat', desc: 'Score with all 3 Multi-Balls' },
  { id: 'magnet_50', name: 'Magnetic Pull', desc: 'Hit center 50 with Magnet active' },
  { id: 'ghost_multi', name: 'Phantom Scorer', desc: 'Score 3+ rings with one Ghost Ball' },
  { id: 'season_stage_1', name: 'First Steps', desc: 'Complete Season Stage 1' },
  { id: 'season_stage_4', name: 'Halfway There', desc: 'Complete 4 Season stages' },
  { id: 'season_complete', name: 'Season Champion', desc: 'Complete all 8 Season stages' },
  { id: 'season_perfect', name: 'Perfect Season', desc: 'Get 3 stars on all Season stages' },
  { id: 'season_3star', name: 'Star Collector', desc: 'Earn your first 3-star rating' },
  { id: 'score_3000', name: 'Ultra Score', desc: 'Score 3000+ in one frame' },
  { id: 'score_5000', name: 'God Score', desc: 'Score 5000+ in one frame' },
  { id: 'total_250k', name: 'Quarter Million', desc: 'Accumulate 250,000 career points' },
  { id: 'boosted_1000', name: 'Boosted', desc: 'Score 1000+ while Score Boost active' },
  { id: 'streak_10', name: 'Untouchable', desc: '10 consecutive 50+ hits' },
  // Round 4 achievements
  { id: 'trick_first', name: 'Trickster', desc: 'Land your first trick shot' },
  { id: 'trick_5', name: 'Showoff', desc: 'Land 5 different trick shots' },
  { id: 'trick_all', name: 'Trick Master', desc: 'Land all 10 trick shot types' },
  { id: 'replay_watch', name: 'Action Replay', desc: 'Watch an instant replay' },
  { id: 'custom_play', name: 'My Rules', desc: 'Complete a Custom Challenge' },
  { id: 'custom_hard', name: 'Masochist', desc: 'Score 500+ in Custom with 0.6x rings + 1.5x speed' },
  { id: 'nothing_but_net', name: 'Nothing But Net', desc: 'Center 50 with 90%+ power' },
  { id: 'hail_mary', name: 'Hail Mary', desc: 'Pocket 100 on your last ball' },
  { id: 'spin_doctor', name: 'Spin Doctor', desc: 'Center 50 with max spin' },
  { id: 'sniper', name: 'Sniper', desc: '3 consecutive center 50s' },
  { id: 'sky_high', name: 'Sky High', desc: 'Ball peaks 0.5m+ above the board' },
  { id: 'speed_1500', name: 'Speed Legend', desc: 'Score 1500+ in Speed Round' },
  { id: 'total_500k', name: 'Half Million', desc: 'Accumulate 500,000 career points' },
  { id: 'games_200', name: 'Obsessed', desc: 'Play 200 games' },
  { id: 'perfect_hard_frame', name: 'Impossible Frame', desc: 'All 50+ hits on Hard difficulty' },
  // Round 5 achievements
  { id: 'endless_wave_3', name: 'Survivor', desc: 'Reach Wave 3 in Endless mode' },
  { id: 'endless_wave_5', name: 'Endurance Runner', desc: 'Reach Wave 5 in Endless mode' },
  { id: 'endless_wave_10', name: 'Unstoppable', desc: 'Reach Wave 10 in Endless mode' },
  { id: 'endless_wave_15', name: 'Eternal Roller', desc: 'Reach Wave 15 in Endless mode' },
  { id: 'moving_target_50', name: 'Moving Target', desc: 'Hit center 50 while targets are moving' },
  { id: 'bumper_bounce', name: 'Bumper Bounce', desc: 'Score 40+ after hitting a lane bumper' },
  { id: 'total_1m', name: 'Millionaire', desc: 'Accumulate 1,000,000 career points' },
  { id: 'games_500', name: 'Addict', desc: 'Play 500 games' },
  { id: 'all_modes', name: 'Well Rounded', desc: 'Play all 10 game modes' },
  { id: 'score_7500', name: 'Transcendent', desc: 'Score 7500+ in one frame' },
  { id: 'score_10000', name: 'Ascended', desc: 'Score 10000+ in one frame' },
  { id: 'streak_15', name: 'Godlike', desc: '15 consecutive 50+ hits' },
  { id: 'endless_no_miss_wave', name: 'Flawless Wave', desc: 'Complete an Endless wave with 100% accuracy' },
  { id: 'pocket_streak_3', name: 'Pocket Sniper', desc: '3 pocket hits in one frame' },
  { id: 'lucky_last', name: 'Lucky Last', desc: 'Score 100+ on the very last ball of a frame' },
];

// ═══════════════════════════════════════════════════
// TRICK SHOTS
// ═══════════════════════════════════════════════════

interface TrickShot {
  id: string;
  name: string;
  desc: string;
  bonusXp: number;
}

const TRICK_SHOTS: TrickShot[] = [
  { id: 'nothing_but_net', name: 'Nothing But Net', desc: 'Center 50 with 90%+ power', bonusXp: 25 },
  { id: 'whisper_shot', name: 'Whisper Shot', desc: 'Score 40+ with under 30% power', bonusXp: 20 },
  { id: 'full_send', name: 'Full Send', desc: 'Score any ring with 100% power', bonusXp: 15 },
  { id: 'spin_doctor', name: 'Spin Doctor', desc: 'Center 50 with max spin (80%+)', bonusXp: 30 },
  { id: 'buzzer_beater', name: 'Buzzer Beater', desc: 'Score 50+ on your last ball', bonusXp: 20 },
  { id: 'hail_mary', name: 'Hail Mary', desc: 'Pocket 100 on your last ball', bonusXp: 50 },
  { id: 'rail_rider', name: 'Rail Rider', desc: 'Ball touches rail then scores 30+', bonusXp: 20 },
  { id: 'sky_high', name: 'Sky High', desc: 'Ball reaches peak height 0.5m+ above board', bonusXp: 15 },
  { id: 'gentle_giant', name: 'Gentle Giant', desc: 'Pocket 100 with under 50% power', bonusXp: 35 },
  { id: 'sniper', name: 'Sniper', desc: '3 consecutive center 50s', bonusXp: 40 },
];

// ═══════════════════════════════════════════════════
// CUSTOM CHALLENGE CONFIG
// ═══════════════════════════════════════════════════

interface CustomConfig {
  balls: number;
  speedMult: number;
  ringScale: number;
  windX: number;
  gravity: number;
  powerUpChance: number;
}

const CUSTOM_DEFAULTS: CustomConfig = {
  balls: 9,
  speedMult: 1.0,
  ringScale: 1.0,
  windX: 0,
  gravity: 1.0,
  powerUpChance: 0.15,
};

// Tournament opponent names and personalities
interface TournamentOpponent {
  name: string;
  title: string;
  skillMult: number; // score multiplier vs base AI
}

const TOURNAMENT_OPPONENTS: TournamentOpponent[][] = [
  // Easy bracket
  [
    { name: 'Rookie Ricky', title: 'The Beginner', skillMult: 0.7 },
    { name: 'Casual Casey', title: 'Weekend Player', skillMult: 0.85 },
    { name: 'Mid Mike', title: 'League Regular', skillMult: 1.0 },
    { name: 'Hot Shot Hannah', title: 'Local Champ', skillMult: 1.15 },
  ],
  // Medium bracket
  [
    { name: 'Steady Sam', title: 'Circuit Regular', skillMult: 0.85 },
    { name: 'Slick Sally', title: 'The Tactician', skillMult: 1.0 },
    { name: 'Power Pete', title: 'The Charger', skillMult: 1.1 },
    { name: 'Ace Anika', title: 'Regional Champ', skillMult: 1.25 },
  ],
  // Hard bracket
  [
    { name: 'Viper Vic', title: 'The Veteran', skillMult: 1.0 },
    { name: 'Flash Fiona', title: 'Speed Queen', skillMult: 1.15 },
    { name: 'Iron Ivan', title: 'The Machine', skillMult: 1.3 },
    { name: 'Neon Nova', title: 'World Champion', skillMult: 1.5 },
  ],
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
  private arpTimer: any = null;
  private arpNotes: OscillatorNode[] = [];

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
    this.startArpeggiator();
  }

  private startAmbient() {
    if (!this.ctx || !this.musicGain) return;
    const c = this.ctx;
    // Base drone
    this.musicOsc = c.createOscillator();
    this.musicOsc.type = 'sine';
    this.musicOsc.frequency.value = 55;
    const droneGain = c.createGain();
    droneGain.gain.value = 0.25;
    this.musicOsc.connect(droneGain);
    droneGain.connect(this.musicGain);
    this.musicOsc.start();
    // Pad
    this.musicPad = c.createOscillator();
    this.musicPad.type = 'triangle';
    this.musicPad.frequency.value = 82.5;
    const padGain = c.createGain();
    padGain.gain.value = 0.15;
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

  private startArpeggiator() {
    if (!this.ctx || !this.musicGain) return;
    // Synthwave arpeggiator — 4-bar loop cycling through chord tones
    const patterns = [
      [110, 165, 220, 277, 330, 277, 220, 165],   // Am chord arpeggiation
      [130.8, 196, 261.6, 330, 392, 330, 261.6, 196], // C chord
      [146.8, 220, 293.7, 370, 440, 370, 293.7, 220], // D chord
      [123.5, 185, 247, 311, 370, 311, 247, 185],      // B chord
    ];
    let barIdx = 0;
    let noteIdx = 0;
    const bpm = 128;
    const noteInterval = (60 / bpm) * 0.5; // 16th note feel

    const playArpNote = () => {
      if (!this.ctx || !this.musicGain) return;
      const c = this.ctx;
      const freq = patterns[barIdx][noteIdx];
      const o = c.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = freq;
      const g = c.createGain();
      g.gain.setValueAtTime(0.12, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + noteInterval * 0.9);
      const f = c.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 1200 + Math.sin(c.currentTime * 0.5) * 600;
      f.Q.value = 2;
      o.connect(f);
      f.connect(g);
      g.connect(this.musicGain!);
      o.start();
      o.stop(c.currentTime + noteInterval);
      this.arpNotes.push(o);
      // Cleanup old refs
      if (this.arpNotes.length > 16) this.arpNotes.splice(0, 8);
      noteIdx++;
      if (noteIdx >= patterns[barIdx].length) {
        noteIdx = 0;
        barIdx = (barIdx + 1) % patterns.length;
      }
    };

    this.arpTimer = setInterval(playArpNote, noteInterval * 1000);
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

  bumperHitSound() {
    // Punchy metallic bounce
    this.playTone(500, 'square', 0.08, 0.3);
    this.playTone(700, 'triangle', 0.06, 0.2);
    this.playNoise(0.05, 0.15, 4000);
  }

  waveStartSound() {
    // Rising synth sweep for new wave
    if (!this.ctx || !this.sfxGain) return;
    const c = this.ctx;
    const o = c.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(200, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(1200, c.currentTime + 0.4);
    const g = c.createGain();
    g.gain.setValueAtTime(0.2, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.5);
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 2000;
    o.connect(f);
    f.connect(g);
    g.connect(this.sfxGain);
    o.start();
    o.stop(c.currentTime + 0.5);
  }

  slowMoSound() {
    // Deep whoosh for slow-mo
    if (!this.ctx || !this.sfxGain) return;
    const c = this.ctx;
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(300, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(60, c.currentTime + 0.6);
    const g = c.createGain();
    g.gain.setValueAtTime(0.3, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.6);
    o.connect(g);
    g.connect(this.sfxGain);
    o.start();
    o.stop(c.currentTime + 0.6);
  }

  bigHitSound() {
    // Dramatic impact sound for 100-point hits
    this.playTone(80, 'sine', 0.4, 0.4);
    this.playTone(160, 'triangle', 0.3, 0.2);
    this.playNoise(0.15, 0.25, 5000);
  }

  tutorialDing() {
    this.playTone(880, 'sine', 0.2, 0.25);
    setTimeout(() => this.playTone(1100, 'sine', 0.15, 0.2), 120);
  }

  powerUpCollect() {
    [880, 1100, 1320, 1760].forEach((n, i) => {
      setTimeout(() => this.playTone(n, 'sine', 0.2, 0.25), i * 60);
    });
  }

  powerUpExpire() {
    this.playTone(300, 'triangle', 0.3, 0.15);
    this.playTone(200, 'triangle', 0.4, 0.1);
  }

  seasonComplete() {
    [523, 659, 784, 1047, 1319, 1568].forEach((n, i) => {
      setTimeout(() => this.playTone(n, 'sine', 0.4, 0.3), i * 120);
    });
  }

  starEarned() {
    this.playTone(1047, 'sine', 0.3, 0.25);
    setTimeout(() => this.playTone(1319, 'sine', 0.25, 0.2), 150);
  }

  scorePopSound(points: number) {
    // Quick pitch based on points
    const freq = 400 + points * 4;
    this.playTone(freq, 'sine', 0.08, 0.12);
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
  spinX = 0; // Ball spin for curve mechanics (-1 to 1)
  slowMoTimer = 0; // Slow-motion countdown
  cameraShake = 0; // Camera shake intensity
  tutorialStep = 0; // Tutorial progression
  currentOpponent: TournamentOpponent | null = null;
  curvedBullseye = false; // Track if a curved ball hit center

  // XP / Level system
  xp = 0;
  level = 1;
  xpForNext = 100;
  levelUpPending = false;

  // Spin tracking
  spinApplied = false; // Was spin used on current throw?

  // Power-up state
  activePowerUp: PowerUpDef | null = null;
  powerUpTimer = 0;
  powerUpsUsed = new Set<string>();
  multiBallHits = 0; // Track multi-ball scoring
  ghostHits = 0; // Track ghost ball multi-hits
  boostedScore = 0; // Track score while boost active

  // Trick shot state
  trickShotsLanded = new Set<string>(); // Persisted trick shot types
  lastThrowPower = 0; // Power of the last throw
  lastThrowSpin = 0; // Spin of the last throw
  railTouched = false; // Did ball touch rail on this throw?
  peakHeight = 0; // Max Y during flight
  consecutiveFifties = 0; // Consecutive 50-point center hits
  trickShotThisThrow: TrickShot | null = null; // Detected trick on this throw

  // Replay state
  replayFrames: Vector3[] = []; // Ball positions during current throw
  lastReplayFrames: Vector3[] = []; // Saved from last throw for replay
  replayPlaying = false;
  replayIndex = 0;
  replayTimer = 0;
  autoReplayPending = false;

  // Custom challenge state
  customConfig: CustomConfig = { ...CUSTOM_DEFAULTS };

  // Endless survival state
  endlessWave = 1;
  endlessBestWave = 0;
  endlessTargetScore = 150;
  endlessMovingTargets = false; // Activates after wave 3
  endlessBumpers = false; // Activates after wave 5

  // Moving target state (ring oscillation)
  ringOffsets: number[] = [0, 0, 0, 0, 0]; // X offset per ring
  ringOscActive = false;
  pocketOscActive = false;
  pocketOffsets: number[] = [0, 0]; // Y offset per pocket

  // Season state
  seasonStageIndex = 0;
  seasonStars: number[] = []; // Stars per stage (0-3)

  // Persistent data
  private _achievements: Set<string>;
  private _leaderboard: LeaderboardEntry[];
  private _stats: { games: number; totalScore: number; bestScore: number; totalRolls: number; totalHits: number; bestCombo: number; skinsUsed: Set<string>; themesUsed: Set<string>; pocketHits: number; fiftyHits: number; dailyPlayed: number; xp: number; level: number; modesPlayed: Set<string>; };
  masterVol = 0.7; sfxVol = 0.8; musicVol = 0.15;
  _bumperHitThisThrow = false;

  constructor() {
    this._achievements = new Set(JSON.parse(localStorage.getItem('skee_achievements') || '[]'));
    this._leaderboard = JSON.parse(localStorage.getItem('skee_leaderboard') || '[]');
    const savedStats = JSON.parse(localStorage.getItem('skee_stats') || 'null');
    this._stats = savedStats ? { ...savedStats, skinsUsed: new Set(savedStats.skinsUsed || []), themesUsed: new Set(savedStats.themesUsed || []), modesPlayed: new Set(savedStats.modesPlayed || []) } : {
      games: 0, totalScore: 0, bestScore: 0, totalRolls: 0, totalHits: 0, bestCombo: 0,
      skinsUsed: new Set<string>(), themesUsed: new Set<string>(), pocketHits: 0, fiftyHits: 0, dailyPlayed: 0, xp: 0, level: 1, modesPlayed: new Set<string>(),
    };
    this.themeIndex = parseInt(localStorage.getItem('skee_theme') || '0');
    this.skinIndex = parseInt(localStorage.getItem('skee_skin') || '0');
    // Restore XP/level from stats
    this.xp = this._stats.xp || 0;
    this.level = this._stats.level || 1;
    this.xpForNext = this.calcXpForLevel(this.level + 1);
    // Restore season stars
    this.seasonStars = JSON.parse(localStorage.getItem('skee_season_stars') || '[]');
    if (this.seasonStars.length < SEASON_STAGES.length) {
      while (this.seasonStars.length < SEASON_STAGES.length) this.seasonStars.push(0);
    }
    // Restore power-ups used set
    this.powerUpsUsed = new Set(JSON.parse(localStorage.getItem('skee_powerups_used') || '[]'));
    // Restore trick shots landed
    this.trickShotsLanded = new Set(JSON.parse(localStorage.getItem('skee_tricks_landed') || '[]'));
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
    // Score boost doubles points before combo
    const boosted = this.activePowerUp?.id === 'scoreboost' ? points * 2 : points;
    const multiplied = boosted * this.comboMultiplier;
    this.score += multiplied;
    this.lastScore = multiplied;
    this.rollsThisFrame.push(multiplied);
    this.hits++;

    // Track boosted score for achievement
    if (this.activePowerUp?.id === 'scoreboost') {
      this.boostedScore += multiplied;
    }

    // Track ghost hits
    if (this.activePowerUp?.id === 'ghost') {
      this.ghostHits++;
    }

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
    this._stats.modesPlayed.add(this.mode);
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
    const s = { ...this._stats, skinsUsed: [...this._stats.skinsUsed], themesUsed: [...this._stats.themesUsed], modesPlayed: [...this._stats.modesPlayed] };
    localStorage.setItem('skee_stats', JSON.stringify(s));
  }

  saveTheme() { localStorage.setItem('skee_theme', String(this.themeIndex)); }
  saveSkin() { localStorage.setItem('skee_skin', String(this.skinIndex)); }

  // XP system
  calcXpForLevel(lvl: number): number { return Math.floor(80 * Math.pow(1.15, lvl - 1)); }
  
  awardXp(amount: number): boolean {
    this.xp += amount;
    this._stats.xp = this.xp;
    this._stats.level = this.level;
    let leveledUp = false;
    while (this.xp >= this.xpForNext) {
      this.xp -= this.xpForNext;
      this.level++;
      this.xpForNext = this.calcXpForLevel(this.level + 1);
      leveledUp = true;
      this.levelUpPending = true;
    }
    this._stats.xp = this.xp;
    this._stats.level = this.level;
    this.saveStats();
    return leveledUp;
  }

  getXpForScore(score: number): number {
    let base = Math.floor(score / 10);
    if (this.mode === 'tournament') base = Math.floor(base * 1.5);
    if (this.mode === 'daily') base = Math.floor(base * 1.3);
    if (this.difficulty === 'hard') base = Math.floor(base * 1.4);
    if (this.difficulty === 'easy') base = Math.floor(base * 0.8);
    return Math.max(5, base);
  }

  // Skin unlock check: skins 0-3 always available, 4-5 at level 5, 6 at level 10, 7 at level 15
  isSkinUnlocked(idx: number): boolean {
    if (idx <= 3) return true;
    if (idx <= 5) return this.level >= 5;
    if (idx === 6) return this.level >= 10;
    return this.level >= 15;
  }

  // Season methods
  saveSeasonStars() {
    localStorage.setItem('skee_season_stars', JSON.stringify(this.seasonStars));
  }

  getSeasonTotalStars(): number {
    return this.seasonStars.reduce((a, b) => a + b, 0);
  }

  isStageUnlocked(idx: number): boolean {
    if (idx === 0) return true;
    // Unlock next stage if previous has at least 1 star
    return this.seasonStars[idx - 1] > 0;
  }

  // Endless mode methods
  getEndlessWaveTarget(wave: number): number {
    // Escalating target: 150 base, +50 per wave, with exponential ramp after wave 5
    if (wave <= 5) return 150 + (wave - 1) * 50;
    return 400 + Math.floor((wave - 5) * 75 * Math.pow(1.08, wave - 5));
  }

  getEndlessBallCount(wave: number): number {
    // Start with 9, add 1 every 3 waves, cap at 15
    return Math.min(15, 9 + Math.floor((wave - 1) / 3));
  }

  advanceEndlessWave(): boolean {
    // Returns true if player met the target
    if (this.score >= this.endlessTargetScore) {
      this.endlessWave++;
      this.endlessTargetScore = this.getEndlessWaveTarget(this.endlessWave);
      // Enable dynamic targets after wave 3
      if (this.endlessWave >= 3) this.endlessMovingTargets = true;
      // Enable lane bumpers after wave 5
      if (this.endlessWave >= 5) this.endlessBumpers = true;
      return true;
    }
    return false;
  }

  resetEndless() {
    this.endlessWave = 1;
    this.endlessTargetScore = this.getEndlessWaveTarget(1);
    this.endlessMovingTargets = false;
    this.endlessBumpers = false;
    this.ringOscActive = false;
    this.pocketOscActive = false;
    this.ringOffsets = [0, 0, 0, 0, 0];
    this.pocketOffsets = [0, 0];
    // Restore best wave from localStorage
    this.endlessBestWave = parseInt(localStorage.getItem('skee_endless_best') || '0');
  }

  saveEndlessBest() {
    if (this.endlessWave - 1 > this.endlessBestWave) {
      this.endlessBestWave = this.endlessWave - 1;
      localStorage.setItem('skee_endless_best', String(this.endlessBestWave));
    }
  }

  // Moving target update
  updateMovingTargets(time: number) {
    if (!this.ringOscActive && !this.endlessMovingTargets) return;
    // Outer rings oscillate more than inner rings
    const waveIntensity = this.mode === 'endless' ? Math.min(1, (this.endlessWave - 3) / 5) : 1;
    for (let i = 0; i < 5; i++) {
      const amplitude = (i + 1) * 0.015 * waveIntensity; // outer rings move more, scales with wave
      const speed = 0.8 + i * 0.2;
      const phase = i * 1.2;
      this.ringOffsets[i] = Math.sin(time * speed + phase) * amplitude;
    }
    // Pockets oscillate vertically after wave 7
    if (this.pocketOscActive || (this.endlessMovingTargets && this.endlessWave >= 7)) {
      const pocketIntensity = this.mode === 'endless' ? Math.min(1, (this.endlessWave - 7) / 4) : 1;
      this.pocketOffsets[0] = Math.sin(time * 0.6) * 0.03 * pocketIntensity;
      this.pocketOffsets[1] = Math.sin(time * 0.6 + Math.PI) * 0.03 * pocketIntensity;
    }
  }

  calculateStars(stageIdx: number, score: number): number {
    const stage = SEASON_STAGES[stageIdx];
    if (!stage) return 0;
    if (score >= stage.targetScore) return 3;
    if (score >= stage.targetScore * 0.7) return 2;
    if (score >= stage.targetScore * 0.4) return 1;
    return 0;
  }

  // Power-up tracking
  activatePowerUp(pu: PowerUpDef) {
    this.activePowerUp = pu;
    this.powerUpTimer = pu.duration;
    this.powerUpsUsed.add(pu.id);
    localStorage.setItem('skee_powerups_used', JSON.stringify([...this.powerUpsUsed]));
    if (pu.id === 'ghost') this.ghostHits = 0;
    if (pu.id === 'scoreboost') this.boostedScore = 0;
  }

  // Trick shot tracking
  resetThrowTracking() {
    this.railTouched = false;
    this.peakHeight = 0;
    this.trickShotThisThrow = null;
    this.replayFrames = [];
    this._bumperHitThisThrow = false;
  }

  recordReplayFrame(pos: Vector3) {
    this.replayFrames.push(pos.clone());
  }

  saveReplay() {
    this.lastReplayFrames = [...this.replayFrames];
  }

  detectTrickShot(points: number, isPocket: boolean): TrickShot | null {
    // Check each trick shot condition
    if (points === 50 && this.lastThrowPower >= 0.9) {
      return TRICK_SHOTS.find(t => t.id === 'nothing_but_net')!;
    }
    if (points >= 40 && this.lastThrowPower < 0.3) {
      return TRICK_SHOTS.find(t => t.id === 'whisper_shot')!;
    }
    if (points > 0 && this.lastThrowPower >= 0.99) {
      return TRICK_SHOTS.find(t => t.id === 'full_send')!;
    }
    if (points === 50 && Math.abs(this.lastThrowSpin) >= 0.8) {
      return TRICK_SHOTS.find(t => t.id === 'spin_doctor')!;
    }
    if (points >= 50 && this.ballsRemaining === 0) {
      return TRICK_SHOTS.find(t => t.id === 'buzzer_beater')!;
    }
    if (isPocket && this.ballsRemaining === 0) {
      return TRICK_SHOTS.find(t => t.id === 'hail_mary')!;
    }
    if (this.railTouched && points >= 30) {
      return TRICK_SHOTS.find(t => t.id === 'rail_rider')!;
    }
    if (this.peakHeight >= BOARD_Y + 0.5) {
      return TRICK_SHOTS.find(t => t.id === 'sky_high')!;
    }
    if (isPocket && this.lastThrowPower < 0.5) {
      return TRICK_SHOTS.find(t => t.id === 'gentle_giant')!;
    }
    if (points === 50 && this.consecutiveFifties >= 2) {
      return TRICK_SHOTS.find(t => t.id === 'sniper')!;
    }
    return null;
  }

  landTrickShot(trick: TrickShot) {
    this.trickShotThisThrow = trick;
    this.trickShotsLanded.add(trick.id);
    localStorage.setItem('skee_tricks_landed', JSON.stringify([...this.trickShotsLanded]));
  }

  updatePowerUpTimer(dt: number): boolean {
    if (!this.activePowerUp || this.activePowerUp.duration === 0) return false;
    this.powerUpTimer -= dt;
    if (this.powerUpTimer <= 0) {
      this.activePowerUp = null;
      this.powerUpTimer = 0;
      return true; // expired
    }
    return false;
  }

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
      // Round 2 achievements
      ['spin_master', this.curvedBullseye],
      ['score_1500', this.score >= 1500],
      ['score_2000', this.score >= 2000],
      ['streak_7', this.maxStreak >= 7],
      ['perfect_accuracy', this.misses === 0 && this.hits >= BALLS_PER_FRAME && this.ballsRemaining === 0],
      ['speed_1000', this.mode === 'speedround' && this.score >= 1000],
      ['tournament_sweep', this.mode === 'tournament' && this.tournamentRound >= 4 && this.tournamentScores.every((s, i) => s > this.tournamentAIScores[i])],
      ['games_100', this._stats.games >= 100],
      ['total_100k', this._stats.totalScore >= 100000],
      ['all_skins', this._stats.skinsUsed.size >= 8],
      ['all_themes', this._stats.themesUsed.size >= 5],
      ['daily_streak_3', this._stats.dailyPlayed >= 3],
      ['progressive_10', this.mode === 'progressive' && this.progressiveLevel >= 10],
      ['triple_pocket', this._stats.pocketHits >= 3 && this.pocketsHitThisFrame.size >= 2],
      ['no_miss_hard', this.misses === 0 && this.hits > 0 && this.ballsRemaining === 0 && this.difficulty === 'hard'],
      // Round 3 achievements
      ['powerup_collect', this.powerUpsUsed.size > 0],
      ['powerup_all', this.powerUpsUsed.size >= 5],
      ['multiball_hit', this.multiBallHits >= 3],
      ['magnet_50', this.activePowerUp?.id === 'magnet' && this.ringsHitThisFrame.has(50)],
      ['ghost_multi', this.ghostHits >= 3],
      ['season_stage_1', this.seasonStars.filter(s => s > 0).length >= 1],
      ['season_stage_4', this.seasonStars.filter(s => s > 0).length >= 4],
      ['season_complete', this.seasonStars.filter(s => s > 0).length >= 8],
      ['season_perfect', this.seasonStars.filter(s => s >= 3).length >= 8],
      ['season_3star', this.seasonStars.some(s => s >= 3)],
      ['score_3000', this.score >= 3000],
      ['score_5000', this.score >= 5000],
      ['total_250k', this._stats.totalScore >= 250000],
      ['boosted_1000', this.boostedScore >= 1000],
      ['streak_10', this.maxStreak >= 10],
      // Round 4 achievements
      ['trick_first', this.trickShotsLanded.size >= 1],
      ['trick_5', this.trickShotsLanded.size >= 5],
      ['trick_all', this.trickShotsLanded.size >= 10],
      ['custom_play', this.mode === 'custom'],
      ['custom_hard', this.mode === 'custom' && this.score >= 500 && this.customConfig.ringScale <= 0.6 && this.customConfig.speedMult >= 1.5],
      ['nothing_but_net', this.trickShotsLanded.has('nothing_but_net')],
      ['hail_mary', this.trickShotsLanded.has('hail_mary')],
      ['spin_doctor', this.trickShotsLanded.has('spin_doctor')],
      ['sniper', this.trickShotsLanded.has('sniper')],
      ['sky_high', this.trickShotsLanded.has('sky_high')],
      ['speed_1500', this.mode === 'speedround' && this.score >= 1500],
      ['total_500k', this._stats.totalScore >= 500000],
      ['games_200', this._stats.games >= 200],
      ['perfect_hard_frame', this.difficulty === 'hard' && this.misses === 0 && this.hits >= BALLS_PER_FRAME && this.ballsRemaining === 0 && this.rollsThisFrame.every(r => r >= 50)],
      // Round 5 achievements
      ['endless_wave_3', this.mode === 'endless' && this.endlessWave >= 3],
      ['endless_wave_5', this.mode === 'endless' && this.endlessWave >= 5],
      ['endless_wave_10', this.mode === 'endless' && this.endlessWave >= 10],
      ['endless_wave_15', this.mode === 'endless' && this.endlessWave >= 15],
      ['moving_target_50', this.ringOscActive && this.ringsHitThisFrame.has(50)],
      ['bumper_bounce', (this as any)._bumperHitThisThrow && this.lastScore >= 40],
      ['total_1m', this._stats.totalScore >= 1000000],
      ['games_500', this._stats.games >= 500],
      ['all_modes', (this._stats as any).modesPlayed?.size >= 10],
      ['score_7500', this.score >= 7500],
      ['score_10000', this.score >= 10000],
      ['streak_15', this.maxStreak >= 15],
      ['endless_no_miss_wave', this.mode === 'endless' && this.misses === 0 && this.hits > 0 && this.ballsRemaining === 0],
      ['pocket_streak_3', this.pocketsHitThisFrame.size >= 2 && this._stats.pocketHits >= 3],
      ['lucky_last', this.ballsRemaining === 0 && this.lastScore >= 100],
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
    const mult = this.currentOpponent ? this.currentOpponent.skillMult : 1;
    return Math.floor((base + Math.floor(Math.random() * 200)) * mult);
  }

  getTournamentOpponent(round: number): TournamentOpponent {
    const bracketIdx = this.difficulty === 'easy' ? 0 : this.difficulty === 'medium' ? 1 : 2;
    const bracket = TOURNAMENT_OPPONENTS[bracketIdx];
    return bracket[Math.min(round, bracket.length - 1)];
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
    ringMeshRefs.length = 0;
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

      ringMeshRefs.push({ mesh: ringMesh, glowMesh: glowRing, baseX: 0 });
    });

    // Center bullseye sphere
    const bullseye = new Mesh(new SphereGeometry(0.04, 16, 16), new MeshBasicMaterial({ color: new Color(t.ring1), transparent: true, opacity: 0.9 }));
    bullseye.position.set(0, BOARD_Y, BOARD_Z + 0.03);
    laneGroup.add(bullseye);

    // Corner pockets
    pocketMeshRefs.length = 0;
    POCKET_POSITIONS.forEach((pp, pi) => {
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

      pocketMeshRefs.push({ mesh: pocketMesh, glowMesh: pGlow, baseY: BOARD_Y + pp.y });
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

    // Lane bumpers (visible when active in Endless mode or custom)
    buildBumpers(t);

    // Spotlight on scoring board
    const boardLight = new SpotLight(new Color(t.glow) as any, 2, 5, Math.PI / 4, 0.5);
    boardLight.position.set(0, BOARD_Y + 1, BOARD_Z + 0.5);
    boardLight.target.position.set(0, BOARD_Y, BOARD_Z);
    laneGroup.add(boardLight);
    laneGroup.add(boardLight.target);
  }

  // ═══ LANE BUMPERS ═══
  interface BumperDef {
    x: number;
    z: number;
    radius: number;
    mesh: Mesh | null;
    glowMesh: Mesh | null;
  }
  const laneBumpers: BumperDef[] = [
    { x: -0.12, z: LANE_Z + LANE_LENGTH / 2 - 0.7, radius: 0.04, mesh: null, glowMesh: null },
    { x: 0.10, z: LANE_Z + LANE_LENGTH / 2 - 1.2, radius: 0.04, mesh: null, glowMesh: null },
    { x: -0.08, z: LANE_Z + LANE_LENGTH / 2 - 1.6, radius: 0.035, mesh: null, glowMesh: null },
  ];

  function buildBumpers(t: Theme) {
    laneBumpers.forEach(b => {
      if (b.mesh) { laneGroup.remove(b.mesh); b.mesh = null; }
      if (b.glowMesh) { laneGroup.remove(b.glowMesh); b.glowMesh = null; }
      // Create bumper meshes (always created, visibility toggled)
      const bGeo = new CylinderGeometry(b.radius, b.radius, 0.06, 12);
      const bMat = new MeshStandardMaterial({ color: new Color(t.accent), emissive: new Color(t.accent), emissiveIntensity: 0.5, metalness: 0.7, roughness: 0.2 });
      b.mesh = new Mesh(bGeo, bMat);
      b.mesh.position.set(b.x, LANE_Y + 0.03, b.z);
      b.mesh.visible = gsm.endlessBumpers;
      laneGroup.add(b.mesh);
      // Glow ring
      const gGeo = new TorusGeometry(b.radius + 0.01, 0.005, 4, 16);
      const gMat = new MeshBasicMaterial({ color: new Color(t.accent), transparent: true, opacity: 0.4, blending: AdditiveBlending });
      b.glowMesh = new Mesh(gGeo, gMat);
      b.glowMesh.position.copy(b.mesh.position);
      b.glowMesh.position.y += 0.04;
      b.glowMesh.rotation.x = Math.PI / 2;
      b.glowMesh.visible = gsm.endlessBumpers;
      laneGroup.add(b.glowMesh);
    });
  }

  function updateBumperVisibility() {
    laneBumpers.forEach(b => {
      if (b.mesh) b.mesh.visible = gsm.endlessBumpers;
      if (b.glowMesh) b.glowMesh.visible = gsm.endlessBumpers;
    });
  }

  // Ring position update indices (stored after buildLane creates ring meshes)
  let ringMeshIndices: number[] = [];
  let pocketMeshIndices: number[] = [];
  const ringMeshRefs: { mesh: Mesh; glowMesh: Mesh; baseX: number }[] = [];
  const pocketMeshRefs: { mesh: Mesh; glowMesh: Mesh; baseY: number }[] = [];

  function cacheRingIndices() {
    // After buildLane, cache which children are the ring and pocket meshes
    // Ring meshes are added after board, in RINGS order (pairs: mesh + glow)
    ringMeshIndices = [];
    pocketMeshIndices = [];
    // We don't track indices — just update by scanning for torus geometry at known Z
    // Better approach: store references during buildLane
  }

  function updateRingPositions() {
    if (!gsm.ringOscActive && !gsm.endlessMovingTargets) return;
    // Update ring mesh positions based on oscillation offsets
    ringMeshRefs.forEach((ref, i) => {
      const offset = gsm.ringOffsets[i] || 0;
      ref.mesh.position.x = ref.baseX + offset;
      ref.glowMesh.position.x = ref.baseX + offset;
    });
    // Update pocket positions
    pocketMeshRefs.forEach((ref, i) => {
      const offset = gsm.pocketOffsets[i] || 0;
      ref.mesh.position.y = ref.baseY + offset;
      ref.glowMesh.position.y = ref.baseY + offset;
    });
  }

  function checkBumperCollision(pos: Vector3, vel: Vector3): boolean {
    if (!gsm.endlessBumpers) return false;
    for (const b of laneBumpers) {
      const dx = pos.x - b.x;
      const dz = pos.z - b.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < b.radius + 0.035) {
        // Bounce: reflect velocity away from bumper center
        const nx = dx / dist;
        const nz = dz / dist;
        const dot = vel.x * nx + vel.z * nz;
        vel.x -= 2 * dot * nx;
        vel.z -= 2 * dot * nz;
        vel.x *= 0.8; // Energy loss
        vel.z *= 0.8;
        // Push ball out of bumper
        pos.x = b.x + (b.radius + 0.04) * nx;
        pos.z = b.z + (b.radius + 0.04) * nz;
        gsm._bumperHitThisThrow = true;
        // Flash bumper and play sound
        audio.bumperHitSound();
        if (b.glowMesh) {
          (b.glowMesh.material as MeshBasicMaterial).opacity = 1.0;
          setTimeout(() => {
            if (b.glowMesh) (b.glowMesh.material as MeshBasicMaterial).opacity = 0.4;
          }, 200);
        }
        return true;
      }
    }
    return false;
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

    // Record replay frame
    gsm.recordReplayFrame(ball.position.clone());

    for (let s = 0; s < steps; s++) {
      const pos = ball.position;

      if (ballPhase === 'rolling') {
        // Rolling along lane surface
        pos.x += ballVelocity.x * subDt;
        pos.z += ballVelocity.z * subDt;

        // Lane bounds
        const halfW = LANE_WIDTH / 2 - 0.04;
        if (pos.x < -halfW) { pos.x = -halfW; ballVelocity.x *= -0.5; gsm.railTouched = true; }
        if (pos.x > halfW) { pos.x = halfW; ballVelocity.x *= -0.5; gsm.railTouched = true; }

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

        // Check bumper collisions
        checkBumperCollision(pos, ballVelocity);

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
        const slowMult = gsm.slowMoTimer > 0 ? 0.3 : 1;
        ballVelocity.y -= 9.81 * subDt * slowMult;
        pos.x += ballVelocity.x * subDt * slowMult;
        pos.y += ballVelocity.y * subDt * slowMult;
        pos.z += ballVelocity.z * subDt * slowMult;

        // Track peak height for trick shots
        if (pos.y > gsm.peakHeight) gsm.peakHeight = pos.y;

        // Spin / curve: lateral force proportional to spinX during flight
        if (Math.abs(gsm.spinX) > 0.05) {
          ballVelocity.x += gsm.spinX * 2.5 * subDt * slowMult;
          gsm.spinApplied = true;
        }

        // Magnet power-up: curve toward board center
        if (gsm.activePowerUp?.id === 'magnet') {
          const toCenter = -pos.x;
          ballVelocity.x += toCenter * 3.0 * subDt * slowMult;
          const toMidY = (BOARD_Y - pos.y) * 0.5;
          ballVelocity.y += toMidY * subDt * slowMult;
        }

        // Season stage gravity modifier
        if (gsm.mode === 'season') {
          const stage = SEASON_STAGES[gsm.seasonStageIndex];
          if (stage?.modifiers.gravity) {
            // Additional gravity beyond the base already applied
            ballVelocity.y -= 9.81 * subDt * slowMult * (stage.modifiers.gravity - 1);
          }
        }

        // Daily wind modifier
        if (gsm.mode === 'daily') {
          const mods = gsm.getDailyModifiers();
          ballVelocity.x += mods.windX * subDt * slowMult;
        }

        // Season wind modifier
        if (gsm.mode === 'season') {
          const stage = SEASON_STAGES[gsm.seasonStageIndex];
          if (stage?.modifiers.windX) {
            ballVelocity.x += stage.modifiers.windX * subDt * slowMult;
          }
        }

        // Custom challenge modifiers
        if (gsm.mode === 'custom') {
          if (gsm.customConfig.windX !== 0) {
            ballVelocity.x += gsm.customConfig.windX * subDt * slowMult;
          }
          if (gsm.customConfig.gravity !== 1.0) {
            ballVelocity.y -= 9.81 * subDt * slowMult * (gsm.customConfig.gravity - 1);
          }
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
    // Check corner pockets first (with oscillation offsets)
    for (let i = 0; i < POCKET_POSITIONS.length; i++) {
      const pp = POCKET_POSITIONS[i];
      const pocketY = pp.y + gsm.pocketOffsets[i];
      const dx = hitX - pp.x;
      const dy = hitY - pocketY;
      if (Math.sqrt(dx * dx + dy * dy) <= POCKET_RADIUS + 0.02) {
        landBall(POCKET_POINTS, true);
        return;
      }
    }

    // Check rings (inner to outer, with oscillation offsets)
    for (let ri = 0; ri < RINGS.length; ri++) {
      const ring = RINGS[ri];
      const offsetX = gsm.ringOffsets[ri] || 0;
      const adjX = hitX - offsetX;
      const dist = Math.sqrt(adjX * adjX + hitY * hitY);
      if (dist <= ring.outerR) {
        landBall(ring.points);
        return;
      }
    }

    // Missed all rings (hit board but outside scoring area)
    const dist = Math.sqrt(hitX * hitX + hitY * hitY);
    if (dist <= BOARD_RADIUS) {
      landBall(10); // outer board area still scores 10
    } else {
      landBall(-1); // complete miss
    }
  }

  function landBall(points: number, isPocket = false) {
    ballActive = false;
    ballPhase = 'rolling';

    // Save replay
    gsm.saveReplay();

    if (points > 0) {
      // Check for curved bullseye (spin was applied and hit center 50)
      if (points === 50 && gsm.spinApplied && Math.abs(gsm.spinX) > 0.2) {
        gsm.curvedBullseye = true;
      }

      // Track consecutive fifties
      if (points === 50) {
        gsm.consecutiveFifties++;
      } else {
        gsm.consecutiveFifties = 0;
      }

      gsm.registerScore(points, isPocket);

      // Detect trick shot
      const trick = gsm.detectTrickShot(points, isPocket);
      if (trick) {
        gsm.landTrickShot(trick);
        audio.achievementSound();
        showToast(`🎯 TRICK SHOT: ${trick.name}!`);
        gsm.awardXp(trick.bonusXp);
        // Auto-replay on trick shots
        gsm.autoReplayPending = true;
      }
      // Score popup VFX
      if (ball) {
        const popColor = isPocket ? gsm.theme.pocket : points >= 50 ? gsm.theme.ring1 : points >= 30 ? gsm.theme.ring3 : gsm.theme.ring5;
        spawnScorePopup(ball.position.clone(), points * gsm.comboMultiplier, popColor);
        spawnRingFlash(ball.position.x, ball.position.y - BOARD_Y, popColor);
      }
      if (isPocket) {
        audio.pocketHit();
        audio.bigHitSound();
        spawnParticles(ball!.position.clone(), gsm.theme.pocket, 25);
        // Slow-mo and shake on pocket hits
        gsm.slowMoTimer = 0.6;
        gsm.cameraShake = 0.4;
        audio.slowMoSound();
      } else if (points >= 50) {
        audio.ringHit(points);
        spawnParticles(ball!.position.clone(), gsm.theme.ring1, 18);
        gsm.cameraShake = 0.15;
      } else {
        audio.ringHit(points);
        spawnParticles(ball!.position.clone(), points >= 30 ? gsm.theme.ring3 : gsm.theme.ring5, 12);
      }
      if (gsm.combo > 1) {
        audio.comboSound(gsm.combo);
        if (gsm.combo >= 5) gsm.cameraShake = Math.max(gsm.cameraShake, 0.2);
      }
      showToast(`+${points * gsm.comboMultiplier}${gsm.comboMultiplier > 1 ? ' x' + gsm.comboMultiplier : ''}`);
    } else {
      gsm.registerMiss();
      gsm.consecutiveFifties = 0;
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
          // Chance to spawn power-up for next throw
          maybeSpawnPowerUp();
        }
      }, 600);
    }

    gameState = 'scoring';
  }

  function maybeSpawnPowerUp() {
    if (powerUpOrb) return; // Already one active
    if (gsm.activePowerUp && gsm.activePowerUp.duration > 0) return; // Already have a timed power-up
    let chance = 0;
    if (gsm.mode === 'season') {
      chance = SEASON_STAGES[gsm.seasonStageIndex]?.powerUpChance || 0;
    } else if (gsm.mode === 'custom') {
      chance = gsm.customConfig.powerUpChance;
    } else if (gsm.mode === 'daily' || gsm.mode === 'tournament') {
      chance = 0.15;
    } else if (gsm.mode === 'practice') {
      chance = 0.3; // Higher in practice for fun
    } else {
      chance = 0.1; // Low chance in regular modes
    }
    if (Math.random() < chance) {
      spawnPowerUpOrb();
    }
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
    if (gsm.mode === 'endless') {
      // Check if player met the wave target
      if (gsm.advanceEndlessWave()) {
        // Success! Show wave intro and continue
        gsm.checkAchievements((a) => {
          audio.achievementSound();
          showToast('Achievement: ' + a.name);
        });
        audio.seasonComplete();
        audio.waveStartSound();
        // Award XP for clearing the wave
        const waveXp = Math.floor(gsm.score / 5 + gsm.endlessWave * 10);
        gsm.awardXp(waveXp);
        showToast(`Wave ${gsm.endlessWave - 1} cleared! +${waveXp} XP`);
        // Reset for next wave
        gsm.resetFrame();
        gsm.ballsRemaining = gsm.getEndlessBallCount(gsm.endlessWave);
        gsm.frameNumber = gsm.endlessWave;
        updateBumperVisibility();
        // Brief wave intro
        gameState = 'waveintro';
        showUI('');
        showHUD(true);
        updateHUD();
        setText(panelEntities['toast'], 'toast-text', '');
        setTimeout(() => {
          showToast(`⚡ Wave ${gsm.endlessWave} — Target: ${gsm.endlessTargetScore}`);
          setTimeout(() => {
            createBall();
            gameState = 'aiming';
            maybeSpawnPowerUp();
          }, 1500);
        }, 500);
        return;
      } else {
        // Failed to meet target — game over
        gsm.saveEndlessBest();
        showToast(`Wave ${gsm.endlessWave} failed! Best: Wave ${gsm.endlessBestWave}`);
      }
    }
    gsm.endGame();
    // Award XP
    const xpEarned = gsm.getXpForScore(gsm.score);
    const didLevel = gsm.awardXp(xpEarned);
    gsm.checkAchievements((a) => {
      audio.achievementSound();
      showToast('Achievement: ' + a.name);
    });

    // Season mode: show season result instead of game over
    if (gsm.mode === 'season') {
      const stageIdx = gsm.seasonStageIndex;
      const stars = gsm.calculateStars(stageIdx, gsm.score);
      // Update stars if better
      if (stars > (gsm.seasonStars[stageIdx] || 0)) {
        gsm.seasonStars[stageIdx] = stars;
        gsm.saveSeasonStars();
      }
      gsm.checkAchievements((a) => {
        audio.achievementSound();
        showToast('Achievement: ' + a.name);
      });
      if (stars >= 3) audio.seasonComplete();
      else if (stars > 0) audio.starEarned();
      else audio.gameOver();
      gameState = 'seasonresult';
      showUI('seasonresult');
      showHUD(false);
      updateSeasonResultPanel(stageIdx, stars);
      // Show XP
      setTimeout(() => showToast(`+${xpEarned} XP`), 1200);
      if (didLevel) {
        setTimeout(() => {
          audio.achievementSound();
          showToast(`LEVEL UP! Level ${gsm.level}`);
        }, 2500);
      }
      // Clean up power-up orb
      removePowerUpOrb();
      return;
    }

    gameState = 'gameover';
    audio.gameOver();
    showUI('gameover');
    updateGameOverPanel();
    // Show XP earned in toast
    setTimeout(() => showToast(`+${xpEarned} XP`), 1200);
    if (didLevel) {
      setTimeout(() => {
        audio.achievementSound();
        showToast(`LEVEL UP! Level ${gsm.level}`);
      }, 2500);
    }
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

  // ═══ SCORE POPUP VFX ═══
  const scorePopups: { mesh: Mesh; vel: Vector3; life: number; group: Group }[] = [];

  function spawnScorePopup(pos: Vector3, points: number, color: string) {
    // Create a small glowing sphere cluster that represents the score visually
    const group = new Group();
    group.position.copy(pos);
    // Size proportional to points
    const scale = 0.02 + (points / 100) * 0.03;
    const numDots = Math.min(Math.ceil(points / 20), 8);
    const c = new Color(color);
    for (let i = 0; i < numDots; i++) {
      const dot = new Mesh(
        new SphereGeometry(scale, 4, 4),
        new MeshBasicMaterial({ color: c, transparent: true, opacity: 0.9, blending: AdditiveBlending })
      );
      dot.position.set(
        (Math.random() - 0.5) * 0.05,
        (Math.random() - 0.5) * 0.03,
        (Math.random() - 0.5) * 0.05
      );
      group.add(dot);
    }
    // Central glow
    const glow = new Mesh(
      new SphereGeometry(scale * 2, 8, 8),
      new MeshBasicMaterial({ color: c, transparent: true, opacity: 0.4, blending: AdditiveBlending })
    );
    group.add(glow);
    world.scene.add(group);
    scorePopups.push({
      mesh: glow, vel: new Vector3(0, 1.5, 0.3), life: 1.2, group
    });
    audio.scorePopSound(points);
  }

  function updateScorePopups(dt: number) {
    for (let i = scorePopups.length - 1; i >= 0; i--) {
      const sp = scorePopups[i];
      sp.group.position.add(sp.vel.clone().multiplyScalar(dt));
      sp.vel.y += dt * 0.5; // Rise faster
      sp.life -= dt;
      const alpha = Math.max(0, sp.life / 1.2);
      sp.group.children.forEach(c => {
        (c as Mesh).material && ((c as Mesh).material as MeshBasicMaterial).opacity !== undefined &&
          ((c as Mesh).material as MeshBasicMaterial).opacity !== 0 && (((c as Mesh).material as MeshBasicMaterial).opacity = alpha);
      });
      sp.group.scale.setScalar(1 + (1.2 - sp.life) * 0.5);
      if (sp.life <= 0) {
        world.scene.remove(sp.group);
        scorePopups.splice(i, 1);
      }
    }
  }

  // ═══ RING FLASH EFFECT ═══
  const ringFlashes: { mesh: Mesh; life: number }[] = [];

  // ═══ INSTANT REPLAY ═══
  const replayTrailMeshes: Mesh[] = [];
  let replayGhostBall: Mesh | null = null;

  function startReplay() {
    if (gsm.lastReplayFrames.length < 5) return;
    gsm.replayPlaying = true;
    gsm.replayIndex = 0;
    gsm.replayTimer = 0;
    gsm.autoReplayPending = false;
    // Show replay indicator
    if (panelEntities['replay']?.object3D) panelEntities['replay'].object3D.visible = true;
    setText(panelEntities['replay'], 'replay-label', '◀◀ REPLAY');
    // Create ghost ball
    if (!replayGhostBall) {
      replayGhostBall = new Mesh(
        new SphereGeometry(0.035, 12, 12),
        new MeshBasicMaterial({ color: new Color('#ffffff'), transparent: true, opacity: 0.7, blending: AdditiveBlending })
      );
    }
    world.scene.add(replayGhostBall);
    // Unlock replay achievement
    if (gsm.unlock('replay_watch')) {
      const ach = ACHIEVEMENTS.find(a => a.id === 'replay_watch');
      if (ach) {
        audio.achievementSound();
        showToast('Achievement: ' + ach.name);
      }
    }
  }

  function stopReplay() {
    gsm.replayPlaying = false;
    gsm.replayIndex = 0;
    if (panelEntities['replay']?.object3D) panelEntities['replay'].object3D.visible = false;
    if (replayGhostBall) {
      world.scene.remove(replayGhostBall);
    }
    // Clear replay trail
    replayTrailMeshes.forEach(m => world.scene.remove(m));
    replayTrailMeshes.length = 0;
  }

  function updateReplay(dt: number) {
    if (!gsm.replayPlaying || gsm.lastReplayFrames.length < 5) {
      if (gsm.replayPlaying) stopReplay();
      return;
    }
    gsm.replayTimer += dt;
    // Slow-mo replay: 3x slower
    const replaySpeed = 0.33;
    const frameInterval = 1 / 60; // Original capture rate approx
    const targetFrame = Math.floor(gsm.replayTimer / (frameInterval / replaySpeed));

    if (targetFrame >= gsm.lastReplayFrames.length) {
      // Replay finished
      stopReplay();
      return;
    }

    gsm.replayIndex = targetFrame;
    const pos = gsm.lastReplayFrames[targetFrame];
    if (replayGhostBall && pos) {
      replayGhostBall.position.copy(pos);
      // Add trail point
      if (targetFrame % 3 === 0) {
        const dot = new Mesh(
          new SphereGeometry(0.006, 4, 4),
          new MeshBasicMaterial({ color: new Color('#ffffff'), transparent: true, opacity: 0.5, blending: AdditiveBlending })
        );
        dot.position.copy(pos);
        world.scene.add(dot);
        replayTrailMeshes.push(dot);
      }
    }
    // Fade older trail meshes
    replayTrailMeshes.forEach((m, i) => {
      const age = (replayTrailMeshes.length - i) / replayTrailMeshes.length;
      (m.material as MeshBasicMaterial).opacity = age * 0.5;
    });
  }

  function spawnRingFlash(hitX: number, hitY: number, colorStr: string) {
    // Bright flash at impact point on the scoring board
    const flash = new Mesh(
      new SphereGeometry(0.08, 8, 8),
      new MeshBasicMaterial({ color: new Color(colorStr), transparent: true, opacity: 1.0, blending: AdditiveBlending })
    );
    flash.position.set(hitX, BOARD_Y + hitY, BOARD_Z + 0.05);
    world.scene.add(flash);
    ringFlashes.push({ mesh: flash, life: 0.4 });

    // Expanding ring wave
    const ring = new Mesh(
      new TorusGeometry(0.02, 0.005, 4, 16),
      new MeshBasicMaterial({ color: new Color(colorStr), transparent: true, opacity: 0.8, blending: AdditiveBlending })
    );
    ring.position.copy(flash.position);
    ring.rotation.x = Math.PI / 2;
    world.scene.add(ring);
    ringFlashes.push({ mesh: ring, life: 0.5 });
  }

  function updateRingFlashes(dt: number) {
    for (let i = ringFlashes.length - 1; i >= 0; i--) {
      const rf = ringFlashes[i];
      rf.life -= dt;
      const alpha = Math.max(0, rf.life / 0.5);
      (rf.mesh.material as MeshBasicMaterial).opacity = alpha;
      // Expand torus ring
      if (rf.mesh.geometry instanceof TorusGeometry) {
        rf.mesh.scale.setScalar(1 + (0.5 - rf.life) * 6);
      }
      if (rf.life <= 0) {
        world.scene.remove(rf.mesh);
        ringFlashes.splice(i, 1);
      }
    }
  }

  // ═══ POWER-UP ORBS ═══
  let powerUpOrb: { mesh: Group; def: PowerUpDef; bobPhase: number } | null = null;

  function spawnPowerUpOrb() {
    if (powerUpOrb) return; // Only one at a time
    const def = POWER_UP_DEFS[Math.floor(Math.random() * POWER_UP_DEFS.length)];
    const group = new Group();
    const color = new Color(def.color);

    // Core sphere
    const core = new Mesh(
      new SphereGeometry(0.04, 12, 12),
      new MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6, metalness: 0.8, roughness: 0.2 })
    );
    group.add(core);

    // Outer glow
    const glow = new Mesh(
      new SphereGeometry(0.07, 8, 8),
      new MeshBasicMaterial({ color, transparent: true, opacity: 0.3, blending: AdditiveBlending })
    );
    group.add(glow);

    // Orbiting ring
    const ring = new Mesh(
      new TorusGeometry(0.06, 0.005, 4, 16),
      new MeshBasicMaterial({ color, transparent: true, opacity: 0.6 })
    );
    group.add(ring);

    // Position above the lane, slightly randomized
    const x = (Math.random() - 0.5) * LANE_WIDTH * 0.6;
    group.position.set(x, LANE_Y + 0.25, LANE_Z + LANE_LENGTH / 2 - 0.8 - Math.random() * 0.8);

    world.scene.add(group);
    powerUpOrb = { mesh: group, def, bobPhase: Math.random() * Math.PI * 2 };
  }

  function removePowerUpOrb() {
    if (powerUpOrb) {
      world.scene.remove(powerUpOrb.mesh);
      powerUpOrb = null;
    }
  }

  function updatePowerUpOrb(dt: number, time: number) {
    if (!powerUpOrb) return;
    // Bob up and down
    powerUpOrb.bobPhase += dt * 3;
    powerUpOrb.mesh.position.y = LANE_Y + 0.25 + Math.sin(powerUpOrb.bobPhase) * 0.03;
    // Rotate the ring
    const ring = powerUpOrb.mesh.children[2];
    if (ring) {
      ring.rotation.x += dt * 2;
      ring.rotation.z += dt * 1.5;
    }
    // Pulse glow
    const glow = powerUpOrb.mesh.children[1] as Mesh;
    if (glow) {
      (glow.material as MeshBasicMaterial).opacity = 0.2 + Math.sin(time * 4) * 0.15;
    }

    // Check collision with ball
    if (ball && ballActive) {
      const dist = ball.position.distanceTo(powerUpOrb.mesh.position);
      if (dist < 0.12) {
        collectPowerUp(powerUpOrb.def);
        removePowerUpOrb();
      }
    }
  }

  function collectPowerUp(def: PowerUpDef) {
    gsm.activatePowerUp(def);
    audio.powerUpCollect();
    showToast(`Power-Up: ${def.name}!`);
    updatePowerUpHUD();

    // Apply instant power-ups
    if (def.id === 'multiball') {
      // Spawn 2 extra balls (visual clones that score independently)
      gsm.multiBallHits = 0;
      for (let i = 0; i < 2; i++) {
        setTimeout(() => spawnExtraBall(i), i * 200 + 100);
      }
    }
    if (def.id === 'bigball' && ball) {
      ball.scale.setScalar(1.8);
    }

    gsm.checkAchievements((a) => {
      audio.achievementSound();
      showToast('Achievement: ' + a.name);
    });
  }

  // Extra balls for multi-ball power-up
  const extraBalls: { mesh: Mesh; vel: Vector3; active: boolean }[] = [];

  function spawnExtraBall(offsetIdx: number) {
    if (!ball || !ballActive) return;
    const skin = gsm.skin;
    const extra = new Mesh(
      new SphereGeometry(0.03, 12, 12),
      new MeshStandardMaterial({ color: new Color(skin.color), emissive: new Color(skin.emissive), emissiveIntensity: 0.5, metalness: 0.6, roughness: 0.3, transparent: true, opacity: 0.7 })
    );
    const glw = new Mesh(
      new SphereGeometry(0.05, 6, 6),
      new MeshBasicMaterial({ color: new Color('#ff00ff'), transparent: true, opacity: 0.3, blending: AdditiveBlending })
    );
    extra.add(glw);
    extra.position.copy(ball.position);
    const spread = (offsetIdx === 0 ? -1 : 1) * 0.08;
    extra.position.x += spread;
    const vel = ballVelocity.clone();
    vel.x += spread * 2;
    world.scene.add(extra);
    extraBalls.push({ mesh: extra, vel, active: true });
  }

  function updateExtraBalls(dt: number) {
    for (let i = extraBalls.length - 1; i >= 0; i--) {
      const eb = extraBalls[i];
      if (!eb.active) continue;
      eb.vel.y -= 9.81 * dt;
      eb.mesh.position.add(eb.vel.clone().multiplyScalar(dt));
      // Check if reached board
      if (eb.mesh.position.z <= BOARD_Z + 0.05) {
        const hitX = eb.mesh.position.x;
        const hitY = eb.mesh.position.y - BOARD_Y;
        // Score the extra ball
        scoreExtraBall(hitX, hitY);
        world.scene.remove(eb.mesh);
        eb.active = false;
        extraBalls.splice(i, 1);
      }
      // Cleanup if fell below
      if (eb.mesh.position.y < LANE_Y - 0.5) {
        world.scene.remove(eb.mesh);
        eb.active = false;
        extraBalls.splice(i, 1);
      }
    }
  }

  function scoreExtraBall(hitX: number, hitY: number) {
    const dist = Math.sqrt(hitX * hitX + hitY * hitY);
    let points = 0;
    for (const pp of POCKET_POSITIONS) {
      const dx = hitX - pp.x;
      const dy = hitY - pp.y;
      if (Math.sqrt(dx * dx + dy * dy) <= POCKET_RADIUS + 0.02) {
        points = POCKET_POINTS;
        break;
      }
    }
    if (points === 0) {
      for (const ring of RINGS) {
        if (dist <= ring.outerR) { points = ring.points; break; }
      }
      if (points === 0 && dist <= BOARD_RADIUS) points = 10;
    }
    if (points > 0) {
      gsm.score += points;
      gsm.multiBallHits++;
      gsm.hits++;
      audio.ringHit(points);
      spawnScorePopup(new Vector3(hitX, BOARD_Y + hitY, BOARD_Z + 0.05), points, gsm.theme.accent);
      spawnRingFlash(hitX, hitY, gsm.theme.ring1);
      spawnParticles(new Vector3(hitX, BOARD_Y + hitY, BOARD_Z + 0.05), gsm.theme.accent, 8);
      showToast(`Multi-Ball: +${points}`);
      updateHUD();
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
  createPanel('tutorial', 'tutorial', { width: 0.8, height: 0.6, pos: [0, 1.5, -2] });
  createPanel('season', 'season', { width: 0.9, height: 0.9, pos: [0, 1.5, -2] });
  createPanel('seasonresult', 'seasonresult', { width: 0.8, height: 0.7, pos: [0, 1.5, -2] });
  createPanel('poweruphud', 'poweruphud', { width: 0.25, height: 0.06, follower: true, pos: [-0.2, 0.06, -0.5] });
  createPanel('replay', 'replay', { width: 0.2, height: 0.04, follower: true, pos: [0, 0.15, -0.5] });
  createPanel('customsetup', 'customsetup', { width: 0.9, height: 0.9, pos: [0, 1.5, -2] });

  // Panel visibility management
  function showUI(name: string) {
    const allPanels = ['title', 'modeselect', 'difficulty', 'pause', 'gameover', 'leaderboard', 'achievements', 'settings', 'help', 'stats', 'skins', 'tutorial', 'season', 'seasonresult', 'customsetup'];
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
    // Spin indicator
    const spinStr = Math.abs(gsm.spinX) > 0.1 ? (gsm.spinX > 0 ? '→' : '←') + ` ${Math.round(Math.abs(gsm.spinX) * 100)}%` : '';
    setText(e, 'spin-value', spinStr);
    if (gsm.mode === 'speedround') {
      setText(e, 'time-value', String(Math.ceil(gsm.timeRemaining)));
    } else {
      setText(e, 'time-value', '');
    }
    if (gsm.mode === 'target' && gsm.targetRing > 0) {
      setText(e, 'target-value', `Target: ${gsm.targetRing}pts`);
    } else if (gsm.mode === 'endless') {
      setText(e, 'target-value', `Wave ${gsm.endlessWave} | ⚡${gsm.endlessTargetScore}`);
    } else {
      setText(e, 'target-value', '');
    }
    // Level badge
    setText(e, 'level-value', `Lv.${gsm.level}`);
  }

  function updatePowerBar() {
    const e = panelEntities['powerbar'];
    if (!e) return;
    const filled = Math.round(gsm.power * 10);
    const bar = '|'.repeat(filled) + '.'.repeat(10 - filled);
    setText(e, 'power-fill', bar);
    const color = gsm.power < 0.5 ? '#00ff88' : gsm.power < 0.8 ? '#ffaa00' : '#ff2222';
    const spinLabel = Math.abs(gsm.spinX) > 0.1 ? ` ${gsm.spinX > 0 ? '→' : '←'}` : '';
    setText(e, 'power-label', gsm.power > 0 ? `${Math.round(gsm.power * 100)}%${spinLabel}` : 'AIM');
  }

  function updateGameOverPanel() {
    const e = panelEntities['gameover'];
    if (!e) return;
    setText(e, 'final-score', String(gsm.score));
    setText(e, 'accuracy', `${gsm.accuracy}%`);
    setText(e, 'max-combo', `x${gsm.maxCombo}`);
    setText(e, 'hits-misses', `${gsm.hits} / ${gsm.misses}`);
    setText(e, 'xp-earned', `+${gsm.getXpForScore(gsm.score)} XP`);
    setText(e, 'player-level', `Level ${gsm.level}`);
    setText(e, 'xp-progress', `${gsm.xp} / ${gsm.xpForNext}`);

    if (gsm.mode === 'tournament') {
      const playerTotal = gsm.tournamentScores.reduce((a, b) => a + b, 0);
      const aiTotal = gsm.tournamentAIScores.reduce((a, b) => a + b, 0);
      setText(e, 'tournament-result', playerTotal > aiTotal ? 'YOU WIN!' : playerTotal === aiTotal ? 'DRAW!' : 'CPU WINS');
    } else if (gsm.mode === 'endless') {
      setText(e, 'tournament-result', `Endless: Wave ${gsm.endlessWave} | Best: ${gsm.endlessBestWave}`);
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
    setText(e, 'stat-level', `Level ${gsm.level}`);
    setText(e, 'stat-xp', `${gsm.xp} / ${gsm.xpForNext} XP`);
    // Endless best
    const endlessBest = parseInt(localStorage.getItem('skee_endless_best') || '0');
    setText(e, 'stat-endless', endlessBest > 0 ? `Best Wave: ${endlessBest}` : '—');
    setText(e, 'stat-modes', `${s.modesPlayed?.size || 0} / 10`);
  }

  function updatePowerUpHUD() {
    const e = panelEntities['poweruphud'];
    if (!e) return;
    if (gsm.activePowerUp && gsm.powerUpTimer > 0) {
      if (e.object3D) e.object3D.visible = true;
      setText(e, 'pu-icon', gsm.activePowerUp.id === 'magnet' ? '◎' : gsm.activePowerUp.id === 'bigball' ? '●' : gsm.activePowerUp.id === 'scoreboost' ? '×2' : '★');
      setText(e, 'pu-name', gsm.activePowerUp.name);
      setText(e, 'pu-timer', `${Math.ceil(gsm.powerUpTimer)}s`);
    } else {
      if (e.object3D) e.object3D.visible = false;
    }
  }

  function updateCustomSetupPanel() {
    const e = panelEntities['customsetup'];
    if (!e) return;
    const c = gsm.customConfig;
    setText(e, 'custom-balls', String(c.balls));
    setText(e, 'custom-speed', `${c.speedMult.toFixed(1)}x`);
    setText(e, 'custom-ring', `${c.ringScale.toFixed(1)}x`);
    setText(e, 'custom-wind', c.windX === 0 ? '0' : `${c.windX.toFixed(2)}`);
    setText(e, 'custom-grav', `${c.gravity.toFixed(1)}x`);
    setText(e, 'custom-pu', `${Math.round(c.powerUpChance * 100)}%`);
  }

  function updateSeasonPanel() {
    const e = panelEntities['season'];
    if (!e) return;
    const totalStars = gsm.getSeasonTotalStars();
    setText(e, 'total-stars', `★ ${totalStars} / ${SEASON_STAGES.length * 3}`);
    SEASON_STAGES.forEach((stage, i) => {
      const stars = gsm.seasonStars[i] || 0;
      const unlocked = gsm.isStageUnlocked(i);
      const starStr = '★'.repeat(stars) + '☆'.repeat(3 - stars);
      setText(e, `stage-name-${i}`, unlocked ? stage.name : '🔒 Locked');
      setText(e, `stage-stars-${i}`, unlocked ? starStr : '---');
    });
  }

  function updateSeasonResultPanel(stageIdx: number, stars: number) {
    const e = panelEntities['seasonresult'];
    if (!e) return;
    const stage = SEASON_STAGES[stageIdx];
    setText(e, 'sr-stage-name', stage.name);
    setText(e, 'sr-score', String(gsm.score));
    setText(e, 'sr-stars', '★'.repeat(stars) + '☆'.repeat(3 - stars));
    setText(e, 'sr-target', `Target: ${stage.targetScore} for 3★`);
    const msg = stars >= 3 ? 'PERFECT! ★★★' : stars >= 2 ? 'Great run!' : stars >= 1 ? 'Stage cleared!' : 'Try again!';
    setText(e, 'sr-msg', msg);
    // Hide/show next button based on whether next stage exists and is now unlocked
    const hasNext = stageIdx < SEASON_STAGES.length - 1 && stars > 0;
    setVisible(e, 'btn-sr-next', hasNext);
  }

  function updateSkinsPanel() {
    const e = panelEntities['skins'];
    if (!e) return;
    BALL_SKINS.forEach((sk, i) => {
      const unlocked = gsm.isSkinUnlocked(i);
      const selected = i === gsm.skinIndex;
      const prefix = selected ? '> ' : '  ';
      const lock = unlocked ? '' : ` [Lv.${i <= 5 ? 5 : i === 6 ? 10 : 15}]`;
      setText(e, `skin-name-${i}`, `${prefix}${sk.name}${lock}`);
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

  // ═══ TUTORIAL SYSTEM ═══
  const TUTORIAL_STEPS = [
    { text: 'Welcome to Neon Skee!', hint: 'A futuristic skee-ball game in VR + browser' },
    { text: 'Click & Hold to charge power', hint: 'In VR: hold the right trigger' },
    { text: 'Move mouse to aim left/right', hint: 'In VR: use the right thumbstick' },
    { text: 'Release to roll the ball up the ramp', hint: 'The ball launches off the bump into the scoring board' },
    { text: 'Drag mouse sideways while charging for spin', hint: 'Spin curves the ball in flight — land a curved bullseye for the Spin Master achievement!' },
    { text: 'Hit rings for points: center = 50, corners = 100', hint: 'Build combos for score multipliers up to x5!' },
    { text: 'Earn XP to level up and unlock ball skins', hint: 'Hard mode and tournaments give bonus XP' },
  ];

  function updateTutorialPanel() {
    const e = panelEntities['tutorial'];
    if (!e) return;
    const step = TUTORIAL_STEPS[gsm.tutorialStep] || TUTORIAL_STEPS[0];
    setText(e, 'tut-step-text', step.text);
    setText(e, 'tut-hint-text', step.hint);
    setText(e, 'tut-progress', `Step ${gsm.tutorialStep + 1} / ${TUTORIAL_STEPS.length}`);
  }

  function showTutorial() {
    gsm.tutorialStep = 0;
    gameState = 'tutorial';
    showUI('tutorial');
    updateTutorialPanel();
  }

  function advanceTutorial() {
    gsm.tutorialStep++;
    if (gsm.tutorialStep >= TUTORIAL_STEPS.length) {
      // Tutorial done — go to mode select
      localStorage.setItem('skee_tutorial_done', '1');
      audio.tutorialDing();
      gameState = 'modeselect';
      showUI('modeselect');
    } else {
      audio.tutorialDing();
      updateTutorialPanel();
    }
  }

  // ═══ UI EVENT BINDING ═══
  let uiBound = false;
  function bindUIEvents() {
    if (uiBound) return;
    uiBound = true;

    // Retry binding periodically since PanelUI loads async
    const bind = () => {
      // Title
      bindBtn('title', 'btn-play', () => {
        audio.init(); audio.buttonClick();
        // Show tutorial first time
        if (!localStorage.getItem('skee_tutorial_done')) {
          showTutorial();
        } else {
          gameState = 'modeselect'; showUI('modeselect');
        }
      });
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
      bindBtn('modeselect', 'btn-season', () => { audio.buttonClick(); gameState = 'season'; showUI('season'); updateSeasonPanel(); });
      bindBtn('modeselect', 'btn-custom', () => { audio.buttonClick(); gsm.customConfig = { ...CUSTOM_DEFAULTS }; gameState = 'customsetup'; showUI('customsetup'); updateCustomSetupPanel(); });
      bindBtn('modeselect', 'btn-endless', () => { audio.buttonClick(); gsm.mode = 'endless'; gameState = 'difficulty'; showUI('difficulty'); });
      bindBtn('modeselect', 'btn-back-mode', () => { audio.buttonClick(); gameState = 'title'; showUI('title'); });

      // Season panel
      for (let si = 0; si < SEASON_STAGES.length; si++) {
        bindBtn('season', `btn-stage-${si}`, () => {
          audio.buttonClick();
          if (!gsm.isStageUnlocked(si)) {
            audio.gutterSound();
            showToast('Complete the previous stage first!');
            return;
          }
          gsm.seasonStageIndex = si;
          gsm.mode = 'season';
          gsm.difficulty = 'medium';
          startGame();
        });
      }
      bindBtn('season', 'btn-back-season', () => { audio.buttonClick(); gameState = 'modeselect'; showUI('modeselect'); });

      // Season result
      bindBtn('seasonresult', 'btn-sr-retry', () => {
        audio.buttonClick();
        gsm.mode = 'season';
        gsm.difficulty = 'medium';
        startGame();
      });
      bindBtn('seasonresult', 'btn-sr-next', () => {
        audio.buttonClick();
        if (gsm.seasonStageIndex < SEASON_STAGES.length - 1) {
          gsm.seasonStageIndex++;
          gsm.mode = 'season';
          gsm.difficulty = 'medium';
          startGame();
        }
      });
      bindBtn('seasonresult', 'btn-sr-back', () => { audio.buttonClick(); gameState = 'season'; showUI('season'); updateSeasonPanel(); });

      // Custom Challenge setup
      bindBtn('customsetup', 'btn-custom-balls-down', () => { audio.buttonClick(); gsm.customConfig.balls = Math.max(3, gsm.customConfig.balls - 1); updateCustomSetupPanel(); });
      bindBtn('customsetup', 'btn-custom-balls-up', () => { audio.buttonClick(); gsm.customConfig.balls = Math.min(20, gsm.customConfig.balls + 1); updateCustomSetupPanel(); });
      bindBtn('customsetup', 'btn-custom-speed-down', () => { audio.buttonClick(); gsm.customConfig.speedMult = Math.max(0.5, +(gsm.customConfig.speedMult - 0.1).toFixed(1)); updateCustomSetupPanel(); });
      bindBtn('customsetup', 'btn-custom-speed-up', () => { audio.buttonClick(); gsm.customConfig.speedMult = Math.min(2.0, +(gsm.customConfig.speedMult + 0.1).toFixed(1)); updateCustomSetupPanel(); });
      bindBtn('customsetup', 'btn-custom-ring-down', () => { audio.buttonClick(); gsm.customConfig.ringScale = Math.max(0.4, +(gsm.customConfig.ringScale - 0.1).toFixed(1)); updateCustomSetupPanel(); });
      bindBtn('customsetup', 'btn-custom-ring-up', () => { audio.buttonClick(); gsm.customConfig.ringScale = Math.min(1.5, +(gsm.customConfig.ringScale + 0.1).toFixed(1)); updateCustomSetupPanel(); });
      bindBtn('customsetup', 'btn-custom-wind-down', () => { audio.buttonClick(); gsm.customConfig.windX = Math.max(-0.5, +(gsm.customConfig.windX - 0.05).toFixed(2)); updateCustomSetupPanel(); });
      bindBtn('customsetup', 'btn-custom-wind-up', () => { audio.buttonClick(); gsm.customConfig.windX = Math.min(0.5, +(gsm.customConfig.windX + 0.05).toFixed(2)); updateCustomSetupPanel(); });
      bindBtn('customsetup', 'btn-custom-grav-down', () => { audio.buttonClick(); gsm.customConfig.gravity = Math.max(0.5, +(gsm.customConfig.gravity - 0.1).toFixed(1)); updateCustomSetupPanel(); });
      bindBtn('customsetup', 'btn-custom-grav-up', () => { audio.buttonClick(); gsm.customConfig.gravity = Math.min(2.0, +(gsm.customConfig.gravity + 0.1).toFixed(1)); updateCustomSetupPanel(); });
      bindBtn('customsetup', 'btn-custom-pu-down', () => { audio.buttonClick(); gsm.customConfig.powerUpChance = Math.max(0, +(gsm.customConfig.powerUpChance - 0.05).toFixed(2)); updateCustomSetupPanel(); });
      bindBtn('customsetup', 'btn-custom-pu-up', () => { audio.buttonClick(); gsm.customConfig.powerUpChance = Math.min(1.0, +(gsm.customConfig.powerUpChance + 0.05).toFixed(2)); updateCustomSetupPanel(); });
      bindBtn('customsetup', 'btn-custom-start', () => { audio.buttonClick(); gsm.mode = 'custom'; gsm.difficulty = 'medium'; startGame(); });
      bindBtn('customsetup', 'btn-custom-reset', () => { audio.buttonClick(); gsm.customConfig = { ...CUSTOM_DEFAULTS }; updateCustomSetupPanel(); });
      bindBtn('customsetup', 'btn-custom-back', () => { audio.buttonClick(); gameState = 'modeselect'; showUI('modeselect'); });

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
      bindBtn('help', 'btn-tutorial-replay', () => { audio.buttonClick(); showTutorial(); });
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
        bindBtn('skins', `btn-skin-${i}`, () => {
          if (!gsm.isSkinUnlocked(i)) {
            audio.gutterSound();
            showToast(`Reach Level ${i <= 5 ? 5 : i === 6 ? 10 : 15} to unlock`);
            return;
          }
          audio.buttonClick(); gsm.skinIndex = i; gsm.saveSkin(); updateSkinsPanel();
        });
      });

      // Tutorial
      bindBtn('tutorial', 'btn-tut-next', () => { audio.buttonClick(); advanceTutorial(); });
      bindBtn('tutorial', 'btn-tut-skip', () => {
        audio.buttonClick();
        localStorage.setItem('skee_tutorial_done', '1');
        gameState = 'modeselect';
        showUI('modeselect');
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
    } else if (gsm.mode === 'season') {
      const stage = SEASON_STAGES[gsm.seasonStageIndex];
      gsm.ballsRemaining = stage.balls;
    } else if (gsm.mode === 'custom') {
      gsm.ballsRemaining = gsm.customConfig.balls;
    } else if (gsm.mode === 'endless') {
      gsm.resetEndless();
      gsm.ballsRemaining = gsm.getEndlessBallCount(1);
    }

    // Reset dynamic target and bumper state
    gsm.ringOscActive = false;
    gsm.endlessMovingTargets = false;
    gsm.endlessBumpers = false;
    gsm.ringOffsets = [0, 0, 0, 0, 0];
    gsm.pocketOffsets = [0, 0];
    updateBumperVisibility();

    // Clear power-up state
    gsm.activePowerUp = null;
    gsm.powerUpTimer = 0;
    gsm.multiBallHits = 0;
    gsm.ghostHits = 0;
    gsm.boostedScore = 0;
    removePowerUpOrb();
    extraBalls.forEach(eb => { if (eb.active) world.scene.remove(eb.mesh); });
    extraBalls.length = 0;
    if (panelEntities['poweruphud']?.object3D) panelEntities['poweruphud'].object3D.visible = false;

    // Reset big ball scale
    if (ball) ball.scale.setScalar(1);

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
    gsm.spinX = 0;
    gsm.spinApplied = false;
    lastMouseX = e.clientX;
  });

  let lastMouseX = 0;

  container.addEventListener('mousemove', (e) => {
    if (gameState === 'aiming') {
      // Map mouse X to aim direction (-1 to 1)
      const rect = container.getBoundingClientRect();
      gsm.aimX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      if (ball && !ballActive) {
        resetBallPosition();
      }
      // Track spin from mouse drag while charging
      if (gsm.charging && mouseDown) {
        const dx = e.clientX - lastMouseX;
        gsm.spinX = Math.max(-1, Math.min(1, gsm.spinX + dx * 0.005));
      }
      lastMouseX = e.clientX;
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

    // Save throw parameters for trick shot detection
    gsm.lastThrowPower = gsm.power;
    gsm.lastThrowSpin = gsm.spinX;
    gsm.resetThrowTracking();

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

    // Season modifiers
    if (gsm.mode === 'season') {
      const stage = SEASON_STAGES[gsm.seasonStageIndex];
      if (stage?.modifiers.speedMult) speed *= stage.modifiers.speedMult;
    }

    // Custom challenge speed modifier
    if (gsm.mode === 'custom') {
      speed *= gsm.customConfig.speedMult;
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
        gsm.spinX = 0;
        gsm.spinApplied = false;
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
        // Thumbstick Y controls spin while charging
        if (gsm.charging) {
          gsm.spinX = Math.max(-1, Math.min(1, gsm.spinX + thumbstick.x * dt * 3));
        }
        if (ball && !ballActive) resetBallPosition();
      }
    }

    // Update ball physics
    if (ballActive) updateBall(dt);

    // Slow-mo timer decay
    if (gsm.slowMoTimer > 0) {
      gsm.slowMoTimer -= dt;
      if (gsm.slowMoTimer < 0) gsm.slowMoTimer = 0;
    }

    // Camera shake
    if (gsm.cameraShake > 0) {
      gsm.cameraShake -= dt * 2;
      if (gsm.cameraShake < 0) gsm.cameraShake = 0;
      // Apply subtle shake offset to decorations (visual feel without moving camera)
      const shakeX = (Math.random() - 0.5) * gsm.cameraShake * 0.02;
      const shakeY = (Math.random() - 0.5) * gsm.cameraShake * 0.02;
      laneGroup.position.x = shakeX;
      laneGroup.position.z = shakeY;
    } else {
      laneGroup.position.x = 0;
      laneGroup.position.z = 0;
    }

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
    updateScorePopups(dt);
    updateRingFlashes(dt);
    updateExtraBalls(dt);
    updatePowerUpOrb(dt, totalTime);
    updateReplay(dt);

    // Update moving targets
    gsm.updateMovingTargets(totalTime);
    updateRingPositions();

    // Auto-replay after trick shots (with delay)
    if (gsm.autoReplayPending && !ballActive && !gsm.replayPlaying) {
      gsm.autoReplayPending = false;
      setTimeout(() => {
        if (!ballActive && gsm.lastReplayFrames.length >= 5) startReplay();
      }, 400);
    }

    // Power-up timer
    if (gsm.activePowerUp && gsm.activePowerUp.duration > 0) {
      const expired = gsm.updatePowerUpTimer(dt);
      updatePowerUpHUD();
      if (expired) {
        audio.powerUpExpire();
        showToast('Power-up expired');
        // Reset big ball
        if (ball) ball.scale.setScalar(1);
        if (panelEntities['poweruphud']?.object3D) panelEntities['poweruphud'].object3D.visible = false;
      }
    }

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
