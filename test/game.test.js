import { strictEqual, ok } from 'node:assert';
import test from 'node:test';
import { isOccupied, randomApple, updateSpeed } from '../game.js';

test('isOccupied detects occupied tiles', () => {
  const snake = [{ x: 1, y: 1 }];
  const apples = [{ x: 2, y: 2 }];
  const obstacles = [{ x: 3, y: 3 }];

  ok(isOccupied(1, 1, snake, apples, obstacles));
  ok(isOccupied(2, 2, snake, apples, obstacles));
  ok(isOccupied(3, 3, snake, apples, obstacles));
  strictEqual(isOccupied(4, 4, snake, apples, obstacles), false);
});

test('randomApple returns a free position', () => {
  const snake = [{ x: 0, y: 0 }];
  const apples = [{ x: 1, y: 1 }];
  const obstacles = [{ x: 2, y: 2 }];
  const tileCount = 5;

  const seq = [0, 0, 0.3, 0.4, 0.5];
  const origRandom = Math.random;
  let i = 0;
  Math.random = () => seq[i++];

  const apple = randomApple(tileCount, snake, apples, obstacles);

  Math.random = origRandom;

  strictEqual(isOccupied(apple.x, apple.y, snake, apples, obstacles), false);
});

test('updateSpeed calculates delay by length', () => {
  const setting = { frame: 120, minFrame: 60 };
  strictEqual(updateSpeed(1, setting), 120);
  strictEqual(updateSpeed(10, setting), 102);
  strictEqual(updateSpeed(40, setting), 60);
});
