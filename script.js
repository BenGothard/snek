const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const startButton = document.getElementById('start');
const leaderboardEl = document.getElementById('leaderboard');
const gameOverEl = document.getElementById('game-over');
const pausedEl = document.getElementById('paused');
const difficultySelect = document.getElementById('difficulty');
const themeSelect = document.getElementById('theme');

const gridSize = 20;
const tileCount = canvas.width / gridSize;
const appleCount = 3;

function isOccupied(x, y) {
  for (let part of snake) {
    if (part.x === x && part.y === y) return true;
  }
  for (let a of apples) {
    if (a.x === x && a.y === y) return true;
  }
  for (let o of obstacles) {
    if (o.x === x && o.y === y) return true;
  }
  return false;
}

function randomApple() {
  let pos;
  do {
    pos = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount)
    };
  } while (isOccupied(pos.x, pos.y));
  return {
    x: pos.x,
    y: pos.y,
    type: Math.random() < 0.1 ? 'gold' : 'normal'
  };
}

function randomObstacle() {
  let pos;
  do {
    pos = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount)
    };
  } while (isOccupied(pos.x, pos.y));
  return pos;
}

let snake = [{ x: 10, y: 10 }];
let velocity = { x: 0, y: 0 };
let apples = [];
let obstacles = [];
let growing = 0;
let score = 0;
let running = false;
let paused = false;

const difficultySettings = {
  easy: { frame: 150, obstacles: 0 },
  medium: { frame: 120, obstacles: 5 },
  hard: { frame: 90, obstacles: 10 }
};
let currentDifficulty = 'medium';
let frameDelay = difficultySettings[currentDifficulty].frame;
const fastFrameDelay = 75; // ms when holding spacebar
let fastMode = false;

const themes = {
  classic: { bg: '#222', snake: 'lime', apple: 'red', gold: 'gold', obstacle: 'gray' },
  dark: { bg: '#111', snake: '#0f0', apple: '#f55', gold: '#ff0', obstacle: '#666' },
  neon: { bg: '#000', snake: '#0ff', apple: '#f0f', gold: '#ff0', obstacle: '#0f0' }
};
let currentTheme = themes.classic;

let onlineScores = [];

async function loadOnlineLeaderboard() {
  try {
    const res = await fetch('https://example.com/api/scores');
    if (res.ok) {
      const data = await res.json();
      onlineScores = data.scores || [];
    }
  } catch (e) {
    onlineScores = [];
  }
}

async function postScoreOnline(score) {
  try {
    await fetch('https://example.com/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score })
    });
  } catch (e) {}
}

function loadLeaderboard() {
  const data = localStorage.getItem('leaderboard');
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

function saveLeaderboard(scores) {
  localStorage.setItem('leaderboard', JSON.stringify(scores));
}

function renderLeaderboard() {
  const scores = loadLeaderboard();
  leaderboardEl.innerHTML = '';
  scores.forEach((s, i) => {
    const li = document.createElement('li');
    li.textContent = `${i + 1}. ${s}`;
    leaderboardEl.appendChild(li);
  });
  if (onlineScores.length) {
    const header = document.createElement('li');
    header.textContent = '--- Online ---';
    leaderboardEl.appendChild(header);
    onlineScores.forEach((s, i) => {
      const li = document.createElement('li');
      li.textContent = `${i + 1}. ${s}`;
      leaderboardEl.appendChild(li);
    });
  }
}

function addScore(newScore) {
  const scores = loadLeaderboard();
  scores.push(newScore);
  scores.sort((a, b) => b - a);
  if (scores.length > 10) scores.length = 10;
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
  for (let i = 0; i < appleCount; i++) {
    apples.push(randomApple());
  }
  for (let i = 0; i < difficultySettings[currentDifficulty].obstacles; i++) {
    obstacles.push(randomObstacle());
  }
  growing = 0;
  score = 0;
  updateScore();
  canvas.style.background = currentTheme.bg;
}

function updateScore() {
  scoreEl.textContent = `Score: ${score}`;
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
    addScore(score);
    reset();
    gameOverEl.style.display = 'block';
    running = false;
    startButton.disabled = false;
  }
}

let lastTime = 0;

function step(timestamp) {
  const delay = fastMode ? fastFrameDelay : frameDelay;
  if (timestamp - lastTime < delay) return true;
  lastTime = timestamp;

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
      growing += a.type === 'gold' ? 2 : 1;
      apples[i] = randomApple();
    }
  }

  if (growing > 0) {
    growing--;
  } else {
    snake.pop();
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

  for (let a of apples) {
    ctx.fillStyle = a.type === 'gold' ? currentTheme.gold : currentTheme.apple;
    ctx.fillRect(a.x * gridSize, a.y * gridSize, gridSize - 1, gridSize - 1);
  }

  ctx.fillStyle = currentTheme.obstacle;
  for (let o of obstacles) {
    ctx.fillRect(o.x * gridSize, o.y * gridSize, gridSize - 1, gridSize - 1);
  }
}

window.addEventListener('keydown', e => {
  const key = e.key.toLowerCase();
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
});

themeSelect.addEventListener('change', () => {
  currentTheme = themes[themeSelect.value] || themes.classic;
  canvas.style.background = currentTheme.bg;
  if (!running) draw();
});

reset();
renderLeaderboard();
loadOnlineLeaderboard();
startButton.addEventListener('click', () => {
  // give the snake an initial direction so it doesn't immediately
  // collide with itself when the game starts
  velocity = { x: 1, y: 0 };
  startButton.disabled = true;
  gameOverEl.style.display = 'none';
  paused = false;
  pausedEl.style.display = 'none';
  running = true;
  lastTime = 0;
  requestAnimationFrame(gameLoop);
});
