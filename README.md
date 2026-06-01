# Neon Skee VR

A classic skee-ball arcade game reimagined in VR with a holodeck neon wireframe aesthetic. Built with IWSDK 0.4.1.

## Play

**Live:** [https://ellyz2426.github.io/neon-skee/](https://ellyz2426.github.io/neon-skee/)

## Features

### Core Gameplay
- **Classic skee-ball lane** with inclined ramp, bump launcher, and circular scoring board
- **Physics-based ball rolling** up the ramp with bump-launched projectile arc
- **5 scoring rings:** 50 (center), 40, 30, 20, 10 (outer) points
- **2 corner pockets:** 100 points each for precision shots
- **9 balls per standard frame**

### Game Modes
- **Classic** — Standard 9-ball frame, chase the high score
- **Speed Round** — Timed rush (45-90 seconds based on difficulty), unlimited balls
- **Target** — Hit specific ring values called out for bonus scoring
- **Progressive** — Escalating difficulty with each successful frame
- **Daily Challenge** — Date-seeded daily game with unique modifiers (wind, ball speed, ring scale)
- **Tournament** — 4-round bracket against AI scores
- **Practice** — Unlimited balls, no pressure, perfect for learning

### Scoring System
- Combo multiplier builds with consecutive hits (x1 to x5)
- Streak tracking for 50+ point hits
- Per-frame score tracking with accuracy stats

### Customization
- **8 ball skins:** Neon Cyan, Solar Flare, Plasma Pink, Ice Crystal, Toxic Green, Void Purple, Chrome Silver, Inferno Red
- **5 arena themes:** Neon Holodeck, Crimson Arcade, Toxic Neon, Ultra Violet, Solar Blaze
- Settings persistence via localStorage

### 25 Achievements
First Roll, Bullseye, Pocket Master, Half Grand, Grand Score, Perfect Frame, Hot Streak, Fire Streak, Ring Collector, No Gutter, Speed Demon, Sharp Eye, Progressive Pro, Daily Player, Champion, Regular, Dedicated, Scorer, High Roller, Combo King, Fashionista, Theme Explorer, Double Pocket, Comeback, Center Stage

### Audio
- 15+ procedural Web Audio SFX (roll, bump, ring hits, pocket arpeggio, gutter, charge, countdown, game start/end, achievements, combo, button clicks)
- Ambient synthwave drone (55Hz sine + 82.5Hz triangle pad + LFO)
- Volume controls for master, SFX, and music

### Visual Effects
- Ball trail with additive blending (skin-colored)
- Particle bursts on scoring hits (color-coded by ring value)
- Holodeck environment: neon grid floor/ceiling, 14 floating wireframe decorations with rotation + bob, 40 ambient particles with drift + pulse
- Scoring board with glowing ring torus geometry and corner pocket spheres

## Controls

### Browser
| Action | Input |
|--------|-------|
| Charge throw | Click + Hold |
| Aim | Move mouse left/right |
| Roll | Release mouse |
| Pause | ESC |
| Rematch | R (game over) |

### VR
| Action | Input |
|--------|-------|
| Charge throw | Right Trigger (hold) |
| Aim | Right Thumbstick |
| Roll | Release Right Trigger |
| Pause | B Button |
| Menu interaction | Controller laser pointer |

## Technical Details
- **Framework:** IWSDK 0.4.1 (Immersive Web SDK)
- **Runtime:** Dual VR + browser (`xr: { offer: 'once' }` + `browserControls`)
- **UI:** 15 PanelUI `.uikitml` spatial templates, zero HTML DOM overlays
- **Physics:** Custom ball rolling + projectile arc simulation with 4-substep integration
- **Audio:** Procedural Web Audio API synthesis
- **Persistence:** localStorage for achievements, leaderboard, stats, theme, skin
- **Build:** Vite + TypeScript + esbuild

## Project Structure
```
neon-skee/
  src/
    index.ts          # Main game (all logic, physics, UI binding)
    vite-env.d.ts     # Type declarations
  ui/
    title.uikitml     # Title screen
    modeselect.uikitml # Mode selection (7 modes)
    difficulty.uikitml # Difficulty selection
    hud.uikitml       # Head-following HUD
    powerbar.uikitml  # Power charge bar
    pause.uikitml     # Pause menu
    gameover.uikitml  # Game over screen
    leaderboard.uikitml # Top 10 scores
    achievements.uikitml # 25 achievement slots
    settings.uikitml  # Theme + volume controls
    help.uikitml      # Controls + scoring reference
    toast.uikitml     # Toast notifications
    countdown.uikitml # 3-2-1-ROLL countdown
    stats.uikitml     # Career statistics
    skins.uikitml     # Ball skin selector (8 skins)
  vite.config.ts
  package.json
  tsconfig.json
```

## Build & Deploy
```bash
npm run build
# Deploy dist/ to GitHub Pages
```
