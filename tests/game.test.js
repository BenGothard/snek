const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

function loadGame() {
  const html = `<!doctype html><html><body>
  <canvas id="game" width="400" height="400"></canvas>
  <div id="score"></div>
  <button id="start"></button>
  <div id="leaderboard"></div>
  <div id="game-over"></div>
  <div id="paused"></div>
  <select id="difficulty"></select>
  <select id="theme"></select>
  </body></html>`;
  const dom = new JSDOM(html, { runScripts: 'dangerously' });
  const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
  dom.window.eval(script);
  return dom.window;
}

test('isOccupied detects apples and obstacles', () => {
  const win = loadGame();
  win.apples.push({ x: 1, y: 1, type: 'normal' });
  win.obstacles.push({ x: 2, y: 2 });
  expect(win.isOccupied(1, 1)).toBe(true);
  expect(win.isOccupied(2, 2)).toBe(true);
  expect(win.isOccupied(0, 0)).toBe(false);
});

test('randomApple avoids occupied cells', () => {
  const win = loadGame();
  win.apples.push({ x: 1, y: 1, type: 'normal' });
  win.obstacles.push({ x: 2, y: 2 });
  win.snake.push({ x: 3, y: 3 });
  const a = win.randomApple();
  expect(a.x === 1 && a.y === 1).toBe(false);
  expect(a.x === 2 && a.y === 2).toBe(false);
  expect(a.x === 3 && a.y === 3).toBe(false);
});
