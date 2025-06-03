// Reusable game functions for Node.js and browser use

export function isOccupied(x, y, snake = [], apples = [], obstacles = []) {
  for (const part of snake) {
    if (part.x === x && part.y === y) return true;
  }
  for (const a of apples) {
    if (a.x === x && a.y === y) return true;
  }
  for (const o of obstacles) {
    if (o.x === x && o.y === y) return true;
  }
  return false;
}

export function randomApple(tileCount, snake = [], apples = [], obstacles = [], rng = Math.random) {
  const maxAttempts = 100;
  for (let attempts = 0; attempts < maxAttempts; attempts++) {
    const pos = {
      x: Math.floor(rng() * tileCount),
      y: Math.floor(rng() * tileCount)
    };
    if (!isOccupied(pos.x, pos.y, snake, apples, obstacles)) {
      const r = rng();
      let type = 'normal';
      if (r < 0.05) {
        type = 'speed';
      } else if (r < 0.1) {
        type = 'gold';
      }
      return { x: pos.x, y: pos.y, type };
    }
  }
  return null;
}

export function updateSpeed(length, settings, difficulty) {
  const cfg = settings[difficulty];
  const min = cfg.minFrame || 40;
  return Math.max(min, cfg.frame - (length - 1) * 2);
}
