# Snek

A simple JavaScript implementation of the classic Snake game.

## Playing

Open `index.html` in your browser or enable GitHub Pages on this repository to play online.

Use the arrow keys or WASD keys to control the snake. Eat apples to grow longer and increase your score. Some apples are gold and grant bonus points. The snake wraps around when it reaches the edge of the board. Avoid your own tail and the obstacles that appear on higher difficulties.
Hold the spacebar to temporarily speed up the snake. Press <kbd>p</kbd> to pause or resume the game. Select a difficulty level and theme before starting to customize the experience.

Your highest scores are stored locally and displayed in the leaderboard below the game. The game will also try to fetch and submit online scores when possible.

### Features

- Gold apples worth extra points appear occasionally.
- Difficulty levels adjust speed and add obstacles.
- Choose from multiple visual themes.

Enjoy!

## Testing

Run `npm install` to install dependencies, then run `npm test` to execute the Jest test suite in the `tests/` directory.
