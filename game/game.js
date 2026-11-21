// game.js — Dusk Cove's game loop: state, input, timer, hint, score and sound.
//
// The hunt: two panels show the same cove (scene.js) — the left one true, the
// right one carrying the level's changes (differences.js). Clicking a
// difference on either panel rings it on both, chimes, sparkles and counts
// down the "remaining" counter. Wrong clicks cost time and points. A limited
// hint pulses an unfound difference like a sonar ring. The timer bar drains
// and reddens as the seconds run out.

import { drawScene, baseFeatures, VIEW_W, VIEW_H } from './scene.js';
import { LEVELS, variantFeatures } from './differences.js';

const $ = (id) => document.getElementById(id);
const leftCanvas = $('panel-left');
const rightCanvas = $('panel-right');
const leftCtx = leftCanvas.getContext('2d');
const rightCtx = rightCanvas.getContext('2d');

const hud = {
  level: $('level-name'),
  time: $('time-left'),
  timeBar: $('time-bar-fill'),
  score: $('score'),
  remaining: $('remaining'),
  hints: $('hints-left'),
  toast: $('toast'),
  status: $('status'),
  overlay: $('overlay'),
  overlayTitle: $('overlay-title'),
  overlayText: $('overlay-text'),
  overlayBtn: $('overlay-btn'),
  stage: $('stage'),
};

const FIND_POINTS = 100;
const WRONG_PENALTY_SECONDS = 5;
const WRONG_PENALTY_POINTS = 20;
const HINT_COST_POINTS = 30;
const HINTS_PER_LEVEL = 3;
const CLEAR_BONUS_PER_SECOND = 2;

const game = {
  state: 'title', // title | playing | clear | won | over
  levelIndex: 0,
  found: new Set(),
  score: 0,
  timeLeft: 0,
  hintsLeft: HINTS_PER_LEVEL,
  markers: [], // {x, y, born} — found differences, ring draws itself in
  sparkles: [], // {x, y, vx, vy, born} — the find burst
  misses: [], // {x, y, born, side} — wrong clicks, a fading cross
  hintPulse: null, // {x, y, born} — the hint's sonar ring
  lastTick: 0,
};

let audioCtx = null;
function audio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function tone(freq, at, dur, type = 'sine', gain = 0.16) {
  const ctx = audio();
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  env.gain.setValueAtTime(0, ctx.currentTime + at);
  env.gain.linearRampToValueAtTime(gain, ctx.currentTime + at + 0.015);
  env.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + dur);
  osc.connect(env).connect(ctx.destination);
  osc.start(ctx.currentTime + at);
  osc.stop(ctx.currentTime + at + dur + 0.05);
}

/** The find sound: a three-note chime arpeggio, rising. */
function chime() { tone(659.25, 0, 0.35); tone(830.61, 0.07, 0.35); tone(1046.5, 0.14, 0.5); }
/** The wrong-click sound: a dull low thud. */
function thud() { tone(150, 0, 0.16, 'triangle', 0.22); }
/** The hint sound: two soft high pings, like sonar. */
function ping() { tone(1318.5, 0, 0.3, 'sine', 0.1); tone(1318.5, 0.22, 0.4, 'sine', 0.07); }
/** The level-clear sound: a small major arpeggio. */
function fanfare() { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.09, 0.45)); }

function level() { return LEVELS[game.levelIndex]; }
function remaining() { return level().differences.length - game.found.size; }

function startLevel(index, keepScore) {
  game.levelIndex = index;
  if (!keepScore) game.score = 0;
  game.found = new Set();
  game.markers = [];
  game.sparkles = [];
  game.misses = [];
  game.hintPulse = null;
  game.hintsLeft = HINTS_PER_LEVEL;
  game.timeLeft = level().seconds;
  game.state = 'playing';
  hud.overlay.hidden = true;
  updateHud();
  announce(`${level().name}. Find ${level().differences.length} differences.`);
}

function updateHud() {
  hud.level.textContent = level().name;
  hud.score.textContent = String(game.score);
  hud.remaining.textContent = String(remaining());
  hud.hints.textContent = String(game.hintsLeft);
  const total = level().seconds;
  const frac = Math.max(0, game.timeLeft / total);
  hud.timeBar.style.width = `${frac * 100}%`;
  hud.timeBar.style.background = frac > 0.5 ? '#57b25e' : frac > 0.25 ? '#f2b134' : '#e2483d';
  const secs = Math.max(0, Math.ceil(game.timeLeft));
  hud.time.textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  hud.time.classList.toggle('urgent', game.state === 'playing' && game.timeLeft <= 30);
}

function announce(text) { hud.status.textContent = text; }

function toast(text) {
  hud.toast.textContent = text;
  hud.toast.classList.remove('show');
  void hud.toast.offsetWidth; // restart the CSS animation
  hud.toast.classList.add('show');
}

function showOverlay(title, text, button, action) {
  hud.overlayTitle.textContent = title;
  hud.overlayText.textContent = text;
  hud.overlayBtn.textContent = button;
  hud.overlayBtn.onclick = action;
  hud.overlay.hidden = false;
  hud.overlayBtn.focus();
}

/** Scene coordinates from a click on either canvas. */
function clickPoint(event, canvas) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * VIEW_W,
    y: ((event.clientY - rect.top) / rect.height) * VIEW_H,
  };
}

function onPanelClick(event) {
  if (game.state !== 'playing') return;
  const canvas = event.currentTarget;
  const p = clickPoint(event, canvas);
  const hit = level().differences.find((d) => !game.found.has(d.id)
    && Math.hypot(p.x - d.x, p.y - d.y) <= d.r);
  if (hit) {
    game.found.add(hit.id);
    game.markers.push({ x: hit.x, y: hit.y, born: performance.now() });
    for (let i = 0; i < 14; i++) { // the sparkle burst
      const a = (i / 14) * Math.PI * 2;
      const v = 26 + (i % 5) * 9;
      game.sparkles.push({ x: hit.x, y: hit.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 12, born: performance.now() });
    }
    game.score += FIND_POINTS;
    chime();
    hud.stage.classList.remove('flash');
    void hud.stage.offsetWidth;
    hud.stage.classList.add('flash');
    toast(`Found: ${hit.label} · +${FIND_POINTS}`);
    announce(`Found: ${hit.label}. ${remaining()} to go.`);
    if (remaining() === 0) return levelCleared();
  } else {
    game.misses.push({ x: p.x, y: p.y, born: performance.now(), side: canvas === leftCanvas ? 'left' : 'right' });
    game.timeLeft = Math.max(0, game.timeLeft - WRONG_PENALTY_SECONDS);
    game.score = Math.max(0, game.score - WRONG_PENALTY_POINTS);
    thud();
    canvas.classList.remove('shake');
    void canvas.offsetWidth;
    canvas.classList.add('shake');
    toast(`Nothing there — −${WRONG_PENALTY_SECONDS}s, −${WRONG_PENALTY_POINTS} pts`);
    announce(`Nothing there. ${remaining()} differences remain.`);
  }
  updateHud();
}

function levelCleared() {
  const bonus = Math.ceil(game.timeLeft) * CLEAR_BONUS_PER_SECOND;
  game.score += bonus;
  fanfare();
  updateHud();
  if (game.levelIndex + 1 < LEVELS.length) {
    game.state = 'clear';
    showOverlay('Cove cleared!', `${level().name} complete — time bonus +${bonus}. Score ${game.score}. The next cove hides more, and hides it better.`,
      'Next level', () => startLevel(game.levelIndex + 1, true));
  } else {
    game.state = 'won';
    showOverlay('Every difference found!', `You cleared all ${LEVELS.length} coves with a score of ${game.score}. The dusk keeps no more secrets from you.`,
      'Play again', () => startLevel(0, false));
  }
  announce(hud.overlayTitle.textContent);
}

function timeOut() {
  game.state = 'over';
  thud();
  showOverlay('The light has gone', `Time ran out with ${remaining()} difference${remaining() === 1 ? '' : 's'} still hiding in ${level().name}.`,
    'Try this cove again', () => startLevel(game.levelIndex, true));
  announce('Time ran out.');
}

/** A rough spoken location for a point, so a hint can gesture without pointing. */
function regionName(x, y) {
  if (y < 150) return x < 200 ? 'up by the lighthouse lamp' : 'high in the dusk sky';
  if (y < 250) return x < 200 ? 'around the lighthouse' : x < 380 ? 'over the open water' : 'above the harbour houses';
  if (y < 335) return x < 200 ? 'by the lighthouse rocks' : x < 380 ? 'out on the water' : 'along the harbour front';
  return 'down on the sand';
}

function useHint() {
  if (game.state !== 'playing' || game.hintsLeft <= 0) return;
  const open = level().differences.filter((d) => !game.found.has(d.id));
  if (!open.length) return;
  const target = open[Math.floor(Math.random() * open.length)];
  game.hintPulse = { x: target.x, y: target.y, born: performance.now() };
  game.hintsLeft -= 1;
  game.score = Math.max(0, game.score - HINT_COST_POINTS);
  ping();
  toast(`The cove whispers: look ${regionName(target.x, target.y)}`);
  announce(`Hint: look ${regionName(target.x, target.y)}. ${game.hintsLeft} hints left.`);
  updateHud();
}

/** Draw one panel: the scene, then found rings, hint pulse and miss crosses. */
function drawPanel(ctx, features, side, now) {
  drawScene(ctx, features);
  // Found markers: a gold ring that draws itself in, then rests with a soft glow.
  for (const m of game.markers) {
    const age = Math.max(0, (now - m.born) / 1000); // rAF timestamps can predate the click's clock
    const grow = Math.min(1, age / 0.28);
    const ease = 1 - Math.pow(1 - grow, 3);
    const r = 6 + 13 * ease;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,214,110,0.35)';
    ctx.lineWidth = 7;
    ctx.beginPath(); ctx.arc(m.x, m.y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#ffd76e';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(m.x, m.y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath(); ctx.arc(m.x, m.y, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  // Sparkles fly from a fresh find and fall away.
  for (const s of game.sparkles) {
    const age = Math.max(0, (now - s.born) / 1000);
    if (age > 0.7) continue;
    const x = s.x + s.vx * age;
    const y = s.y + s.vy * age + 34 * age * age;
    ctx.fillStyle = `rgba(255,231,154,${1 - age / 0.7})`;
    ctx.beginPath(); ctx.arc(x, y, 2.4, 0, Math.PI * 2); ctx.fill();
  }
  // The hint: two expanding sonar rings around one unfound difference.
  if (game.hintPulse) {
    const age = (now - game.hintPulse.born) / 1000;
    if (age > 1.6) game.hintPulse = null;
    else {
      for (const lag of [0, 0.45]) {
        const t = ((age - lag) % 0.9) / 0.9;
        if (t < 0) continue;
        ctx.strokeStyle = `rgba(120,220,255,${0.85 * (1 - t)})`;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(game.hintPulse.x, game.hintPulse.y, 8 + 34 * t, 0, Math.PI * 2); ctx.stroke();
      }
    }
  }
  // Misses: a red cross that fades where the click landed, on that panel only.
  for (const m of game.misses) {
    if (m.side !== side) continue;
    const age = (now - m.born) / 1000;
    if (age > 0.5) continue;
    ctx.strokeStyle = `rgba(226,72,61,${1 - age / 0.5})`;
    ctx.lineWidth = 3.4;
    const k = 8;
    ctx.beginPath();
    ctx.moveTo(m.x - k, m.y - k); ctx.lineTo(m.x + k, m.y + k);
    ctx.moveTo(m.x + k, m.y - k); ctx.lineTo(m.x - k, m.y + k);
    ctx.stroke();
  }
}

function frame(now) {
  requestAnimationFrame(frame);
  if (game.state === 'playing') {
    const dt = Math.min(0.1, (now - game.lastTick) / 1000 || 0);
    game.timeLeft -= dt;
    if (game.timeLeft <= 0) { game.timeLeft = 0; updateHud(); timeOut(); }
    else if (Math.floor(game.timeLeft * 4) !== Math.floor((game.timeLeft + dt) * 4)) updateHud();
  }
  game.lastTick = now;
  const base = baseFeatures();
  drawPanel(leftCtx, base, 'left', now);
  drawPanel(rightCtx, variantFeatures(base, level()), 'right', now);
}

leftCanvas.addEventListener('click', onPanelClick);
rightCanvas.addEventListener('click', onPanelClick);
$('hint-btn').addEventListener('click', useHint);
$('restart-btn').addEventListener('click', () => startLevel(game.levelIndex, true));
document.addEventListener('keydown', (event) => {
  if (event.key === 'h' || event.key === 'H') useHint();
  if (event.key === 'r' || event.key === 'R') startLevel(game.levelIndex, true);
});

showOverlay('Dusk Cove', 'Two pictures of one cove at dusk — almost the same. Click a difference on either picture to ring it on both. Wrong clicks cost 5 seconds. Three levels, each hiding more than the last.',
  'Start the hunt', () => startLevel(0, false));
updateHud();
requestAnimationFrame(frame);
