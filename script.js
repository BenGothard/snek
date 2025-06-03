import { isOccupied, randomApple, updateSpeed as calcSpeed } from './game.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const npcScoresEl = document.getElementById('npc-scores');
const startButton = document.getElementById('start');
const pauseButton = document.getElementById('pause');
const playerNameInput = document.getElementById('player-name');
const leaderboardEl = document.getElementById('leaderboard');
const gameOverEl = document.getElementById('game-over');
const pausedEl = document.getElementById('paused');
const difficultySelect = document.getElementById('difficulty');
const themeSelect = document.getElementById('theme');
const modeSelect = document.getElementById('mode');
const aiSelect = document.getElementById('ai-behavior');
const timerEl = document.getElementById('timer');

// Online score endpoint
const SCORE_API = 'https://example.com/api/scores';

// Sound effects
const eatSound = new Audio('assets/eat.mp3');
const gameOverSound = new Audio('assets/gameover.mp3');

if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  themeSelect.value = 'dark';
}

// Reduce the size of each tile so more of them fit on the
// canvas. This effectively "zooms out" the board without
// increasing the canvas size.
const gridSize = 10;
const tileCount = canvas.width / gridSize;
const appleCount = 3;
const NPC_COUNT = 3;

function randomObstacle() {
  const maxAttempts = 100;
  for (let attempts = 0; attempts < maxAttempts; attempts++) {
    const pos = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount)
    };
    if (!isOccupied(pos.x, pos.y, snake.concat(getAllNpcParts()), apples, obstacles)) {
      return pos;
    }
  }
  return null;
}

let snake = [{ x: 10, y: 10 }];
let velocity = { x: 0, y: 0 };
let npcs = [];
function getAllNpcParts() {
  return npcs.flatMap(npc => npc.snake);
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
let currentDifficulty = 'medium';
let frameDelay = difficultySettings[currentDifficulty].frame;
const fastFrameDelay = 75; // ms when holding spacebar
let fastMode = false;
let speedBoost = 0;
let currentMode = modeSelect.value;
let timeRemaining = 0;
let aiBehavior = aiSelect.value;

const themes = {
  classic: {
    bg: '#222',
    snake: 'lime',
    npc: 'orange',
    apple: 'red',
    gold: 'gold',
    speed: 'cyan',
    obstacle: 'gray'
  },
  dark: {
    bg: '#111',
    snake: '#0f0',
    npc: '#fa0',
    apple: '#f55',
    gold: '#ff0',
    speed: '#0ff',
    obstacle: '#666'
  },
  neon: {
    bg: '#000',
    snake: '#0ff',
    npc: '#ff8800',
    apple: '#f0f',
    gold: '#ff0',
    speed: '#0ff',
    obstacle: '#0f0'
  }
};
let currentTheme = themes[themeSelect.value] || themes.classic;
document.body.className = themeSelect.value === 'classic' ? '' : themeSelect.value;
canvas.style.background = currentTheme.bg;

let onlineScores = [];
let playerName = '';

async function loadOnlineLeaderboard() {
  try {
    const res = await fetch(SCORE_API);
    if (res.ok) {
      const data = await res.json();
      onlineScores = data.scores || [];
    }
  } catch (e) {
    onlineScores = [];
  }
}

async function postScoreOnline(scoreData) {
  try {
    await fetch(SCORE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scoreData)
    });
  } catch (e) {}
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
  list.forEach((s, i) => {
    const li = document.createElement('li');
    const modeLabel = s.mode ? ` [${s.mode}]` : '';
    li.textContent = `${i + 1}. ${s.name}${modeLabel}: ${s.score}`;
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
}

function reset() {
  snake = [{ x: 10, y: 10 }];
  velocity = { x: 0, y: 0 };
  apples = [];
  obstacles = [];
  frameDelay = difficultySettings[currentDifficulty].frame;
  frameDelay = calcSpeed(snake.length, difficultySettings, currentDifficulty);
  for (let i = 0; i < appleCount; i++) {
    const a = randomApple(tileCount, snake.concat(getAllNpcParts()), apples, obstacles);
    if (a) {
      apples.push(a);
    } else {
      break;
    }
  }
  for (let i = 0; i < difficultySettings[currentDifficulty].obstacles; i++) {
    const o = randomObstacle();
    if (o) {
      obstacles.push(o);
    } else {
      break;
    }
  }
  growing = 0;
  score = 0;
  npcs = [];
  npcScoresEl.innerHTML = '';
  for (let i = 0; i < NPC_COUNT; i++) {
    const npc = {
      snake: [{ x: tileCount - 10 - i, y: tileCount - 10 }],
      velocity: { x: 0, y: 0 },
      growing: 0,
      score: 0,
      scoreEl: document.createElement('p')
    };
    npc.scoreEl.textContent = `NPC ${i + 1} Score: 0`;
    npcScoresEl.appendChild(npc.scoreEl);
    npcs.push(npc);
  }
  updateScore();
  canvas.style.background = currentTheme.bg;
  document.body.className = themeSelect.value === 'classic' ? '' : themeSelect.value;
  speedBoost = 0;
  if (currentMode === 'timed') {
    timeRemaining = 60000;
    timerEl.style.display = 'block';
    timerEl.textContent = 'Time: 60';
  } else {
    timerEl.style.display = 'none';
  }
}

function updateScore() {
  scoreEl.textContent = `Score: ${score}`;
  npcs.forEach((npc, i) => {
    npc.scoreEl.textContent = `NPC ${i + 1} Score: ${npc.score}`;
  });
}

function removeNpc(npc) {
  npc.scoreEl.remove();
  npcs = npcs.filter(n => n !== npc);
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
    addScore({ name: playerName || 'Anonymous', score, mode: currentMode });
    reset();
    gameOverEl.style.display = 'block';
    gameOverSound.currentTime = 0;
    gameOverSound.play();
    running = false;
    startButton.disabled = false;
  }
}

let lastTime = 0;

function chooseNpcVelocity(npc) {
  if (!apples.length) return;
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

  if (aiBehavior === 'random') {
    const dirs = [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 }
    ];
    for (let i = dirs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
    }
    for (const dir of dirs) {
      const nx = (head.x + dir.x + tileCount) % tileCount;
      const ny = (head.y + dir.y + tileCount) % tileCount;
      if (!isBlocked(nx, ny)) {
        npc.velocity = dir;
        return;
      }
    }
    return;
  }

  const target = apples[0];

  function diff(a, b) {
    let d = (b - a + tileCount) % tileCount;
    if (d > tileCount / 2) d -= tileCount;
    return d;
  }

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
  if (aiBehavior === 'normal' && Math.random() < 0.3) {
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
  if (currentMode === 'timed') {
    timeRemaining -= delta;
    if (timeRemaining <= 0) {
      timerEl.textContent = 'Time: 0';
      return false;
    }
    timerEl.textContent = `Time: ${Math.ceil(timeRemaining / 1000)}`;
  }
  if (speedBoost > 0) speedBoost--;

  for (const npc of npcs) {
    chooseNpcVelocity(npc);
  }

  const head = { x: snake[0].x + velocity.x, y: snake[0].y + velocity.y };

  // allow the snake to wrap around the edges
  head.x = (head.x + tileCount) % tileCount;
  head.y = (head.y + tileCount) % tileCount;

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

  snake.unshift(head);

  for (let i = 0; i < apples.length; i++) {
    const a = apples[i];
    if (head.x === a.x && head.y === a.y) {
      score += a.type === 'gold' ? 5 : 1;
      updateScore();
      eatSound.currentTime = 0;
      eatSound.play();
      if (a.type === 'speed') {
        speedBoost = 40;
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

    for (let part of snake) {
      if (part.x === npcHead.x && part.y === npcHead.y) {
        return false;
      }
    }
    let dead = false;
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
        updateScore();
        eatSound.currentTime = 0;
        eatSound.play();
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
      if (velocity.y === 1) break;
      velocity = { x: 0, y: -1 };
      break;
    case 'arrowdown':
    case 's':
      if (velocity.y === -1) break;
      velocity = { x: 0, y: 1 };
      break;
    case 'arrowleft':
    case 'a':
      if (velocity.x === 1) break;
      velocity = { x: -1, y: 0 };
      break;
    case 'arrowright':
    case 'd':
      if (velocity.x === -1) break;
      velocity = { x: 1, y: 0 };
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

difficultySelect.addEventListener('change', () => {
  currentDifficulty = difficultySelect.value;
  if (!running) reset();
  renderLeaderboard();
});

themeSelect.addEventListener('change', () => {
  currentTheme = themes[themeSelect.value] || themes.classic;
  canvas.style.background = currentTheme.bg;
  document.body.className = themeSelect.value === 'classic' ? '' : themeSelect.value;
  if (!running) draw();
});

modeSelect.addEventListener('change', () => {
  if (!running) {
    currentMode = modeSelect.value;
    timerEl.style.display = currentMode === 'timed' ? 'block' : 'none';
    timerEl.textContent = 'Time: 60';
  }
});

aiSelect.addEventListener('change', () => {
  aiBehavior = aiSelect.value;
});

reset();
renderLeaderboard();
loadOnlineLeaderboard();
startButton.addEventListener('click', () => {
  // give the snake an initial direction so it doesn't immediately
  // collide with itself when the game starts
  velocity = { x: 1, y: 0 };
  playerName = playerNameInput.value.trim() || 'Anonymous';
  startButton.disabled = true;
  gameOverEl.style.display = 'none';
  paused = false;
  pausedEl.style.display = 'none';
  currentMode = modeSelect.value;
  aiBehavior = aiSelect.value;
  if (currentMode === 'timed') {
    timeRemaining = 60000;
    timerEl.style.display = 'block';
    timerEl.textContent = 'Time: 60';
  } else {
    timerEl.style.display = 'none';
  }
  running = true;
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
