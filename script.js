const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const startButton = document.getElementById('start');
const leaderboardEl = document.getElementById('leaderboard');

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = [{ x: 10, y: 10 }];
let velocity = { x: 0, y: 0 };
let apple = { x: 5, y: 5 };
let growing = 0;
let score = 0;
let running = false;

function loadLeaderboard() {
  const data = localStorage.getItem('leaderboard');
  return data ? JSON.parse(data) : [];
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
}

function addScore(newScore) {
  const scores = loadLeaderboard();
  scores.push(newScore);
  scores.sort((a, b) => b - a);
  if (scores.length > 10) scores.length = 10;
  saveLeaderboard(scores);
  renderLeaderboard();
}

function reset() {
  snake = [{ x: 10, y: 10 }];
  velocity = { x: 0, y: 0 };
  apple = { x: Math.floor(Math.random() * tileCount), y: Math.floor(Math.random() * tileCount) };
  growing = 0;
  score = 0;
  updateScore();
}

function updateScore() {
  scoreEl.textContent = `Score: ${score}`;
}

function gameLoop(timestamp) {
  if (!running) return;
  if (step(timestamp)) {
    draw();
    requestAnimationFrame(gameLoop);
  } else {
    addScore(score);
    reset();
    running = false;
    startButton.disabled = false;
  }
}

let lastTime = 0;
const frameDelay = 150; // ms

function step(timestamp) {
  if (timestamp - lastTime < frameDelay) return true;
  lastTime = timestamp;

  const head = { x: snake[0].x + velocity.x, y: snake[0].y + velocity.y };

  // end the game if the snake hits the edges
  if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
    return false;
  }

  // check collision with self
  for (let part of snake) {
    if (part.x === head.x && part.y === head.y) {
      return false;
    }
  }

  snake.unshift(head);

  if (head.x === apple.x && head.y === apple.y) {
    score++;
    updateScore();
    growing += 1;
    apple.x = Math.floor(Math.random() * tileCount);
    apple.y = Math.floor(Math.random() * tileCount);
  }

  if (growing > 0) {
    growing--;
  } else {
    snake.pop();
  }

  return true;
}

function draw() {
  ctx.fillStyle = '#222';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'lime';
  for (let part of snake) {
    ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 1, gridSize - 1);
  }

  ctx.fillStyle = 'red';
  ctx.fillRect(apple.x * gridSize, apple.y * gridSize, gridSize - 1, gridSize - 1);
}

window.addEventListener('keydown', e => {
  switch (e.key) {
    case 'ArrowUp':
      if (velocity.y === 1) break;
      velocity = { x: 0, y: -1 };
      break;
    case 'ArrowDown':
      if (velocity.y === -1) break;
      velocity = { x: 0, y: 1 };
      break;
    case 'ArrowLeft':
      if (velocity.x === 1) break;
      velocity = { x: -1, y: 0 };
      break;
    case 'ArrowRight':
      if (velocity.x === -1) break;
      velocity = { x: 1, y: 0 };
      break;
  }
});

reset();
renderLeaderboard();
startButton.addEventListener('click', () => {
  startButton.disabled = true;
  running = true;
  lastTime = 0;
  requestAnimationFrame(gameLoop);
});
