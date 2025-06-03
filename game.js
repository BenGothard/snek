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

export function randomApple(tileCount, snake = [], apples = [], obstacles = []) {
  let pos;
  do {
    pos = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount)
    };
  } while (isOccupied(pos.x, pos.y, snake, apples, obstacles));
  return {
    x: pos.x,
    y: pos.y,
    type: Math.random() < 0.1 ? 'gold' : 'normal'
  };
}

export function updateSpeed(snakeLength, difficultySetting) {
  const min = difficultySetting.minFrame || 40;
  return Math.max(min, difficultySetting.frame - (snakeLength - 1) * 2);
}
