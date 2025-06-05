import { isOccupied, randomApple, updateSpeed as calcSpeed } from './game.js';
import { fetchWithRetry } from './http_client.js';
import { loadRemoteConfig } from './remote_config.js';
import { loadOnlineLeaderboard as fetchLeaderboard, postScoreOnline as submitScore, loadUnsentScores, saveUnsentScores, flushUnsentScores as flushScores } from './scores.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('start');
const pauseButton = document.getElementById('pause');
const upBtn = document.getElementById('btn-up');
const downBtn = document.getElementById('btn-down');
const leftBtn = document.getElementById('btn-left');
const rightBtn = document.getElementById('btn-right');
const pauseTouchBtn = document.getElementById('btn-pause');
const playerNameInput = document.getElementById('player-name');
const leaderboardEl = document.getElementById('leaderboard');
const clearScoresBtn = document.getElementById('clear-scores');
const gameOverEl = document.getElementById('game-over');
const pausedEl = document.getElementById('paused');
const themeSelect = document.getElementById('theme');
const terminalEl = document.getElementById('terminal-log');
const toggleLogBtn = document.getElementById('toggle-log');
if (terminalEl) {
  ['log', 'warn', 'error'].forEach(level => {
    const orig = console[level].bind(console);
    console[level] = (...args) => {
      orig(...args);
      terminalEl.textContent += args.join(' ') + '\n';
      terminalEl.scrollTop = terminalEl.scrollHeight;
    };
  });
}
if (toggleLogBtn && terminalEl) {
  toggleLogBtn.addEventListener('click', () => {
    const hidden = terminalEl.style.display === 'none';
    terminalEl.style.display = hidden ? 'block' : 'none';
    toggleLogBtn.textContent = hidden ? 'Hide Log' : 'Show Log';
  });
}

// Prefill inputs from previous session
const storedTheme = localStorage.getItem('theme');
if (storedTheme) {
  themeSelect.value = storedTheme;
}
const storedName = localStorage.getItem('playerName');
if (storedName) {
  playerNameInput.value = storedName;
}

// Remote configuration defaults
const DEFAULT_CONFIG = {
  ASSET_BASE_URL: '',
  HIGH_SCORE_API_URL: ''
};

const CONFIG = await loadRemoteConfig(DEFAULT_CONFIG);
const SCORE_API = CONFIG.HIGH_SCORE_API_URL;
const ONLINE_ENABLED = Boolean(SCORE_API);

if (!storedTheme && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  themeSelect.value = 'dark';
}

// Number of tiles on each axis of the board. The actual
// pixel size of each tile is calculated based on the canvas
// dimensions so the board can scale with the window size.
const tileCount = 48;
let gridSize;

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  gridSize = canvas.width / tileCount;
}

window.addEventListener('resize', () => {
  resizeCanvas();
  if (!running) draw();
});

resizeCanvas();
// Start with more apples on the board
const appleCount = 5;
const NPC_COUNT = 3;
const NPC_SPAWN_MIN = 2000; // minimum respawn delay in ms
const NPC_SPAWN_MAX = 5000; // maximum respawn delay in ms
// Spawn new apples more frequently
const APPLE_SPAWN_MIN = 2000; // minimum new apple delay in ms
const APPLE_SPAWN_MAX = 3500; // maximum new apple delay in ms

function randomEmptyPosition() {
  const maxAttempts = 100;
  const occupied = snake.concat(getAllNpcParts());
  for (let attempts = 0; attempts < maxAttempts; attempts++) {
    const pos = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount)
    };
    if (!isOccupied(pos.x, pos.y, occupied, apples, obstacles)) {
      return pos;
    }
  }
  return null;
}

const randomObstacle = () => randomEmptyPosition();

let snake = [{ x: 10, y: 10 }];
let velocity = { x: 0, y: 0 };
let npcs = [];
function getAllNpcParts() {
  return npcs.flatMap(npc => npc.snake);
}

function spawnNpc() {
  if (npcs.length >= NPC_COUNT) return;
  const startPos = randomEmptyPosition();
  if (!startPos) return;
  const npc = {
    snake: [startPos],
    velocity: { x: 0, y: 0 },
    growing: 0,
    score: 0
  };
  npcs.push(npc);
  console.log(`NPC spawned at (${startPos.x}, ${startPos.y})`);
}

function scheduleNpcSpawn() {
  const delay =
    NPC_SPAWN_MIN + Math.random() * (NPC_SPAWN_MAX - NPC_SPAWN_MIN);
  setTimeout(() => {
    if (!running) return;
    spawnNpc();
  }, delay);
}

function scheduleAppleSpawn() {
  const delay =
    APPLE_SPAWN_MIN + Math.random() * (APPLE_SPAWN_MAX - APPLE_SPAWN_MIN);
  setTimeout(() => {
    if (!running) return;
    const a = randomApple(
      tileCount,
      snake.concat(getAllNpcParts()),
      apples,
      obstacles
    );
    if (a) {
      apples.push(a);
      console.log(`Apple spawned at (${a.x}, ${a.y})`);
    }
    scheduleAppleSpawn();
  }, delay);
}
let apples = [];
let obstacles = [];
let growing = 0;
let score = 0;
let running = false;
let paused = false;

const difficultySettings = {
  easy: { frame: 150, obstacles: 0, minFrame: 80 },
  medium: { frame: 120, obstacles: 5, minFrame: 60 },
  hard: { frame: 90, obstacles: 10, minFrame: 45 }
};
let currentDifficulty = 'easy';
let frameDelay = difficultySettings[currentDifficulty].frame;
const fastFrameDelay = 75; // ms when holding spacebar
let fastMode = false;
let speedBoost = 0;
let ghostMode = 0;

const themes = {
  classic: {
    bg: '#222',
    snake: 'lime',
    npc: 'orange',
    apple: 'red',
    gold: 'gold',
    speed: 'cyan',
    ghost: 'purple',
    obstacle: 'gray'
  },
  dark: {
    bg: '#111',
    snake: '#0f0',
    npc: '#fa0',
    apple: '#f55',
    gold: '#ff0',
    speed: '#0ff',
    ghost: '#f6f',
    obstacle: '#666'
  },
  neon: {
    bg: '#000',
    snake: '#0ff',
    npc: '#ff8800',
    apple: '#f0f',
    gold: '#ff0',
    speed: '#0ff',
    ghost: '#fff',
    obstacle: '#0f0'
  }
};
let currentTheme = themes[themeSelect.value] || themes.classic;
document.body.className = themeSelect.value === 'classic' ? '' : themeSelect.value;
canvas.style.background = currentTheme.bg;

let onlineScores = [];
let playerName = '';

async function loadOnlineLeaderboard() {
  if (!ONLINE_ENABLED) return;
  try {
    onlineScores = await fetchLeaderboard(SCORE_API);
  } catch {
    onlineScores = [];
  }
}

async function postScoreOnline(scoreData) {
  if (!ONLINE_ENABLED) return;
  try {
    await submitScore(SCORE_API, scoreData);
  } catch (e) {
    const list = loadUnsentScores();
    list.push(scoreData);
    saveUnsentScores(list);
    console.warn('Failed to submit score', e);
  }
}

function loadLeaderboard() {
  const data = localStorage.getItem('leaderboard');
  if (!data) {
    return { easy: [], medium: [], hard: [] };
  }
  try {
    const parsed = JSON.parse(data);
    return {
      easy: parsed.easy || [],
      medium: parsed.medium || [],
      hard: parsed.hard || []
    };
  } catch (e) {
    return { easy: [], medium: [], hard: [] };
  }
}

function saveLeaderboard(scores) {
  localStorage.setItem('leaderboard', JSON.stringify(scores));
}

function renderLeaderboard() {
  const scores = loadLeaderboard();
  const list = scores[currentDifficulty] || [];
  leaderboardEl.innerHTML = '';
  const limit = 10;
  list.slice(0, limit).forEach((s, i) => {
    const li = document.createElement('li');
    li.textContent = `${i + 1}. ${s.name}: ${s.score}`;
    leaderboardEl.appendChild(li);
  });
  if (onlineScores.length) {
    const header = document.createElement('li');
    header.textContent = '--- Online ---';
    leaderboardEl.appendChild(header);
    onlineScores.forEach((s, i) => {
      const li = document.createElement('li');
      li.textContent = s.name
        ? `${i + 1}. ${s.name}: ${s.score}`
        : `${i + 1}. ${s}`;
      leaderboardEl.appendChild(li);
    });
  }
}

function addScore(newScore) {
  const scores = loadLeaderboard();
  const list = scores[currentDifficulty];
  list.push(newScore);
  list.sort((a, b) => b.score - a.score);
  if (list.length > 10) list.length = 10;
  saveLeaderboard(scores);
  renderLeaderboard();
  postScoreOnline(newScore);
  console.log(`Score recorded: ${newScore.name} - ${newScore.score}`);
}

function reset() {
  snake = [{ x: 10, y: 10 }];
  velocity = { x: 0, y: 0 };
  apples = [];
  obstacles = [];
  currentDifficulty = 'easy';
  frameDelay = difficultySettings[currentDifficulty].frame;
  frameDelay = calcSpeed(snake.length, difficultySettings, currentDifficulty);
  for (let i = 0; i < appleCount; i++) {
    const a = randomApple(tileCount, snake.concat(getAllNpcParts()), apples, obstacles);
    if (a) {
      apples.push(a);
      console.log(`Apple spawned at (${a.x}, ${a.y})`);
    } else {
      break;
    }
  }
  for (let i = 0; i < difficultySettings[currentDifficulty].obstacles; i++) {
    const o = randomObstacle();
    if (o) {
      obstacles.push(o);
      console.log(`Obstacle placed at (${o.x}, ${o.y})`);
    } else {
      break;
    }
  }
  growing = 0;
  score = 0;
  npcs = [];
  for (let i = 0; i < NPC_COUNT; i++) {
    spawnNpc();
  }
  canvas.style.background = currentTheme.bg;
  document.body.className = themeSelect.value === 'classic' ? '' : themeSelect.value;
  speedBoost = 0;
  ghostMode = 0;
}

function updateDifficulty() {
  let newDiff = 'easy';
  if (score >= 25) {
    newDiff = 'hard';
  } else if (score >= 10) {
    newDiff = 'medium';
  }
  if (newDiff !== currentDifficulty) {
    currentDifficulty = newDiff;
    while (obstacles.length < difficultySettings[currentDifficulty].obstacles) {
      const o = randomObstacle();
      if (!o) break;
      obstacles.push(o);
    }
    frameDelay = calcSpeed(snake.length, difficultySettings, currentDifficulty);
    renderLeaderboard();
  }
}

function removeNpc(npc) {
  npcs = npcs.filter(n => n !== npc);
  // drop apples where the NPC segments were
  for (const part of npc.snake) {
    if (!isOccupied(part.x, part.y, snake.concat(getAllNpcParts()), apples, obstacles)) {
      apples.push({ x: part.x, y: part.y, type: 'normal' });
    }
  }
  console.log('NPC removed');
  scheduleNpcSpawn();
}


function gameLoop(timestamp) {
  if (!running) return;
  if (paused) {
    requestAnimationFrame(gameLoop);
    return;
  }
  if (step(timestamp)) {
    draw();
    requestAnimationFrame(gameLoop);
  } else {
    console.log('Game over');
    addScore({ name: playerName || 'Anonymous', score });
    reset();
    gameOverEl.style.display = 'block';
    running = false;
    startButton.disabled = false;
  }
}

let lastTime = 0;

function chooseNpcVelocity(npc) {
  if (!apples.length && snake.length === 0) return;
  const head = npc.snake[0];

  function isBlocked(nx, ny) {
    for (const part of snake) {
      if (part.x === nx && part.y === ny) return true;
    }
    for (const part of npc.snake) {
      if (part.x === nx && part.y === ny) return true;
    }
    for (const other of npcs) {
      if (other === npc) continue;
      for (const part of other.snake) {
        if (part.x === nx && part.y === ny) return true;
      }
    }
    for (const obs of obstacles) {
      if (obs.x === nx && obs.y === ny) return true;
    }
    return false;
  }


  function diff(a, b) {
    let d = (b - a + tileCount) % tileCount;
    if (d > tileCount / 2) d -= tileCount;
    return d;
  }

  function nearestApple() {
    let best = null;
    let bestDist = Infinity;
    for (const a of apples) {
      const dx = Math.abs(diff(head.x, a.x));
      const dy = Math.abs(diff(head.y, a.y));
      const dist = dx + dy;
      if (dist < bestDist) {
        bestDist = dist;
        best = a;
      }
    }
    return best;
  }

  const playerHead = snake[0];
  const growPhase = npc.snake.length < 6;
  const chaseChance = Math.min(1, (npc.snake.length - 3) / 12);
  let target;
  if (!growPhase && Math.random() < chaseChance) {
    target = playerHead;
  } else {
    target = nearestApple();
  }
  if (!target) target = playerHead;

  const dx = diff(head.x, target.x);
  const dy = diff(head.y, target.y);

  const primary = Math.abs(dx) > Math.abs(dy)
    ? [{ x: Math.sign(dx), y: 0 }, { x: 0, y: Math.sign(dy) }]
    : [{ x: 0, y: Math.sign(dy) }, { x: Math.sign(dx), y: 0 }];
  const dirs = [
    ...primary,
    { x: -primary[0].x, y: -primary[0].y },
    { x: -primary[1].x, y: -primary[1].y }
  ];
  if (growPhase && Math.random() < 0.3) {
    dirs.sort(() => Math.random() - 0.5);
  }

  for (const dir of dirs) {
    const nx = (head.x + dir.x + tileCount) % tileCount;
    const ny = (head.y + dir.y + tileCount) % tileCount;
    if (!isBlocked(nx, ny)) {
      npc.velocity = dir;
      return;
    }
  }
}

function step(timestamp) {
  const boosted = fastMode || speedBoost > 0;
  const delay = boosted ? Math.min(fastFrameDelay, frameDelay) : frameDelay;
  if (timestamp - lastTime < delay) return true;
  const delta = timestamp - lastTime;
  lastTime = timestamp;
  if (speedBoost > 0) speedBoost--;
  if (ghostMode > 0) ghostMode--;

  for (const npc of npcs) {
    chooseNpcVelocity(npc);
  }

  const head = { x: snake[0].x + velocity.x, y: snake[0].y + velocity.y };

  // allow the snake to wrap around the edges
  head.x = (head.x + tileCount) % tileCount;
  head.y = (head.y + tileCount) % tileCount;

  if (ghostMode === 0) {
    // check collision with self
    for (let part of snake) {
      if (part.x === head.x && part.y === head.y) {
        return false;
      }
    }
    for (const npc of npcs) {
      for (let part of npc.snake) {
        if (part.x === head.x && part.y === head.y) {
          return false;
        }
      }
    }
    for (let obs of obstacles) {
      if (obs.x === head.x && obs.y === head.y) {
        return false;
      }
    }
  }

  snake.unshift(head);

  for (let i = 0; i < apples.length; i++) {
    const a = apples[i];
    if (head.x === a.x && head.y === a.y) {
      score += a.type === 'gold' ? 5 : 1;
      updateDifficulty();
      console.log(`Ate ${a.type} apple at (${a.x}, ${a.y})`);
        if (a.type === 'speed') {
          speedBoost = 40;
        } else if (a.type === 'ghost') {
          ghostMode = 40;
        }
      growing += a.type === 'gold' ? 2 : 1;
      const newApple = randomApple(
        tileCount,
        snake.concat(getAllNpcParts()),
        apples,
        obstacles
      );
      if (newApple) {
        apples[i] = newApple;
      } else {
        apples.splice(i, 1);
        i--;
      }
      frameDelay = calcSpeed(snake.length, difficultySettings, currentDifficulty);
    }
  }

  if (growing > 0) {
    growing--;
  } else {
    snake.pop();
  }

  for (const npc of npcs.slice()) {
    const npcHead = { x: npc.snake[0].x + npc.velocity.x, y: npc.snake[0].y + npc.velocity.y };
    npcHead.x = (npcHead.x + tileCount) % tileCount;
    npcHead.y = (npcHead.y + tileCount) % tileCount;

    let dead = false;
    // check collision with player
    if (snake[0].x === npcHead.x && snake[0].y === npcHead.y && ghostMode === 0) {
      // NPC hit the player's head - game over
      return false;
    }
    for (let i = 1; i < snake.length; i++) {
      const part = snake[i];
      if (part.x === npcHead.x && part.y === npcHead.y && ghostMode === 0) {
        // NPC ran into player's body - NPC dies
        dead = true;
        break;
      }
    }
    for (const other of npcs) {
      if (other === npc) continue;
      for (let part of other.snake) {
        if (part.x === npcHead.x && part.y === npcHead.y) {
          dead = true;
          break;
        }
      }
      if (dead) break;
    }
    if (!dead) {
      for (let obs of obstacles) {
        if (obs.x === npcHead.x && obs.y === npcHead.y) {
          dead = true;
          break;
        }
      }
    }
    if (!dead) {
      for (let part of npc.snake) {
        if (part.x === npcHead.x && part.y === npcHead.y) {
          dead = true;
          break;
        }
      }
    }
    if (dead) {
      removeNpc(npc);
      continue;
    }

    npc.snake.unshift({ x: npcHead.x, y: npcHead.y });

    for (let i = 0; i < apples.length; i++) {
      const a = apples[i];
      if (npcHead.x === a.x && npcHead.y === a.y) {
        npc.score += a.type === 'gold' ? 5 : 1;
        console.log(`NPC ate ${a.type} apple at (${a.x}, ${a.y})`);
        npc.growing += a.type === 'gold' ? 2 : 1;
        const newApple = randomApple(
          tileCount,
          snake.concat(getAllNpcParts()),
          apples,
          obstacles
        );
        if (newApple) {
          apples[i] = newApple;
        } else {
          apples.splice(i, 1);
          i--;
        }
        break;
      }
    }

    if (npc.growing > 0) {
      npc.growing--;
    } else {
      npc.snake.pop();
    }
  }

  return true;
}

function draw() {
  ctx.fillStyle = currentTheme.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = currentTheme.snake;
  for (let part of snake) {
    ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 1, gridSize - 1);
  }

  ctx.fillStyle = currentTheme.npc;
  for (const npc of npcs) {
    for (let part of npc.snake) {
      ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 1, gridSize - 1);
    }
  }

  for (let a of apples) {
    if (a.type === 'gold') {
      ctx.fillStyle = currentTheme.gold;
    } else if (a.type === 'speed') {
      ctx.fillStyle = currentTheme.speed;
    } else if (a.type === 'ghost') {
      ctx.fillStyle = currentTheme.ghost;
    } else {
      ctx.fillStyle = currentTheme.apple;
    }
    ctx.fillRect(a.x * gridSize, a.y * gridSize, gridSize - 1, gridSize - 1);
  }

  ctx.fillStyle = currentTheme.obstacle;
  for (let o of obstacles) {
    ctx.fillRect(o.x * gridSize, o.y * gridSize, gridSize - 1, gridSize - 1);
  }
}

function setDirection(dir) {
  switch (dir) {
    case 'up':
      if (velocity.y !== 1) {
        velocity = { x: 0, y: -1 };
        console.log('Direction: up');
      }
      break;
    case 'down':
      if (velocity.y !== -1) {
        velocity = { x: 0, y: 1 };
        console.log('Direction: down');
      }
      break;
    case 'left':
      if (velocity.x !== 1) {
        velocity = { x: -1, y: 0 };
        console.log('Direction: left');
      }
      break;
    case 'right':
      if (velocity.x !== -1) {
        velocity = { x: 1, y: 0 };
        console.log('Direction: right');
      }
      break;
  }
}

window.addEventListener('keydown', e => {
  const key = e.key.toLowerCase();
  if (
    key === ' ' ||
    key === 'arrowup' ||
    key === 'arrowdown' ||
    key === 'arrowleft' ||
    key === 'arrowright'
  ) {
    e.preventDefault();
  }
  switch (key) {
    case 'arrowup':
    case 'w':
      setDirection('up');
      break;
    case 'arrowdown':
    case 's':
      setDirection('down');
      break;
    case 'arrowleft':
    case 'a':
      setDirection('left');
      break;
    case 'arrowright':
    case 'd':
      setDirection('right');
      break;
    case ' ': // spacebar
      fastMode = true;
      break;
    case 'p':
      paused = !paused;
      pausedEl.style.display = paused ? 'block' : 'none';
      if (!paused) {
        requestAnimationFrame(gameLoop);
      }
      break;
  }
});

window.addEventListener('keyup', e => {
  if (e.key === ' ') {
    fastMode = false;
  }
});


themeSelect.addEventListener('change', () => {
  currentTheme = themes[themeSelect.value] || themes.classic;
  canvas.style.background = currentTheme.bg;
  document.body.className = themeSelect.value === 'classic' ? '' : themeSelect.value;
  localStorage.setItem('theme', themeSelect.value);
  if (!running) draw();
});



reset();
renderLeaderboard();
if (clearScoresBtn) {
  clearScoresBtn.addEventListener('click', () => {
    localStorage.removeItem('leaderboard');
    renderLeaderboard();
    console.log('Local leaderboard cleared');
  });
}
if (ONLINE_ENABLED) {
  loadOnlineLeaderboard();
  flushScores(SCORE_API);
}
startButton.addEventListener('click', () => {
  // give the snake an initial direction so it doesn't immediately
  // collide with itself when the game starts
  velocity = { x: 1, y: 0 };
  playerName = playerNameInput.value.trim() || 'Anonymous';
  localStorage.setItem('playerName', playerNameInput.value.trim());
  localStorage.setItem('theme', themeSelect.value);
  startButton.disabled = true;
  gameOverEl.style.display = 'none';
  paused = false;
  pausedEl.style.display = 'none';
  running = true;
  console.log('Game started');
  scheduleAppleSpawn();
  lastTime = 0;
  requestAnimationFrame(gameLoop);
});

pauseButton.addEventListener('click', () => {
  if (!running) return;
  paused = !paused;
  pausedEl.style.display = paused ? 'block' : 'none';
  if (!paused) {
    requestAnimationFrame(gameLoop);
  }
});

function attachTouch(el, dir) {
  const handler = e => {
    e.preventDefault();
    setDirection(dir);
  };
  el.addEventListener('touchstart', handler);
  el.addEventListener('click', handler);
  el.addEventListener('touchend', e => e.preventDefault());
}

if (upBtn) {
  attachTouch(upBtn, 'up');
  attachTouch(downBtn, 'down');
  attachTouch(leftBtn, 'left');
  attachTouch(rightBtn, 'right');
}

if (pauseTouchBtn) {
  const handlePause = e => {
    e.preventDefault();
    if (!running) return;
    paused = !paused;
    pausedEl.style.display = paused ? 'block' : 'none';
    if (!paused) {
      requestAnimationFrame(gameLoop);
    }
  };
  pauseTouchBtn.addEventListener('touchstart', handlePause);
  pauseTouchBtn.addEventListener('click', handlePause);
  pauseTouchBtn.addEventListener('touchend', e => e.preventDefault());
}
