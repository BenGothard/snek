import { strictEqual, ok } from 'node:assert';
import test from 'node:test';
import { isOccupied, randomApple, updateSpeed } from '../game.js';

test('isOccupied detects occupied tiles', () => {
  const snake = [{ x: 1, y: 1 }];
  const apples = [{ x: 2, y: 2 }];
  const obstacles = [{ x: 3, y: 3 }];
  strictEqual(isOccupied(1, 1, snake, apples, obstacles), true);
  strictEqual(isOccupied(2, 2, snake, apples, obstacles), true);
  strictEqual(isOccupied(3, 3, snake, apples, obstacles), true);
  strictEqual(isOccupied(4, 4, snake, apples, obstacles), false);
});

test('randomApple returns non-colliding position', () => {
  const snake = [{ x: 0, y: 0 }];
  const apples = [{ x: 1, y: 1 }];
  const obstacles = [{ x: 2, y: 2 }];
  const values = [0,0, 0.2,0.2, 0.4,0.4, 0.6,0.6, 0.02];
  let i = 0;
  const rng = () => values[i++];
  const apple = randomApple(5, snake, apples, obstacles, rng);
  strictEqual(apple.x, 3);
  strictEqual(apple.y, 3);
  strictEqual(apple.type, 'speed');
  ok(!isOccupied(apple.x, apple.y, snake, apples, obstacles));
});

test('updateSpeed adjusts delay based on length', () => {
  const settings = {
    easy: { frame: 150, obstacles: 0, minFrame: 80 },
    medium: { frame: 120, obstacles: 5, minFrame: 60 },
    hard: { frame: 90, obstacles: 10, minFrame: 45 }
  };
  strictEqual(updateSpeed(1, settings, 'medium'), 120);
  strictEqual(updateSpeed(10, settings, 'medium'), 102);
  strictEqual(updateSpeed(50, settings, 'medium'), 60);
});
