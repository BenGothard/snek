# Snek

A simple JavaScript implementation of the classic Snake game.

## Playing

Open `index.html` in your browser or enable GitHub Pages on this repository to play online.

Use the arrow keys or WASD keys to control the snake. On touch devices you can swipe on the canvas. If touch is unavailable on-screen arrow buttons are provided. Eat apples to grow longer and increase your score. Some apples are gold and grant bonus points. The snake wraps around when it reaches the edge of the board. Avoid your own tail and the obstacles that appear on higher difficulties.
Hold the spacebar to temporarily speed up the snake. Press <kbd>p</kbd> to pause or resume the game. Select a difficulty level and theme before starting to customize the experience.
You can also enter your name to record it on the local leaderboard and use the on-screen **Pause** button if you prefer the mouse.

Your highest scores are stored locally and displayed in the leaderboard below the game. The game will also try to fetch and submit online scores when possible.

### Features

- Gold apples worth extra points appear occasionally.
- Difficulty levels adjust speed and add obstacles.
- Choose from multiple visual themes.
- Leaderboards are stored per difficulty and include player names.
- The theme defaults to dark when your system prefers it.

Enjoy!

## Setup

Run `./setup.sh` to install the required dependencies (Node.js, npm and
`http-server`). After running the script you can start a local web server with:

```bash
http-server
```

Then open the provided URL in your browser to play the game locally.

### Online scores

The game tries to submit scores, including player names, to `https://example.com/api/scores`. Replace this URL in `script.js` with your own service or remove the calls to disable the feature.
