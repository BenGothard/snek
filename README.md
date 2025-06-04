# Snek

A simple JavaScript implementation of the classic Snake game.

## Playing

Open `index.html` in your browser or enable GitHub Pages on this repository to play online.

Use the arrow keys or WASD keys to control the snake. Eat apples to grow longer and increase your score. Some apples are gold and grant bonus points. The snake wraps around when it reaches the edge of the board. Avoid your own tail and the obstacles that appear on higher difficulties.
Hold the spacebar to temporarily speed up the snake. Press <kbd>p</kbd> to pause or resume the game. Difficulty now increases automatically as you score, so just choose a theme before starting.
You can also enter your name to record it on the local leaderboard and use the on-screen **Pause** or arrow buttons with a mouse or touch.

Your highest scores are stored locally and displayed in the leaderboard below the game. The game will also try to fetch and submit online scores when possible.

### Features

- Gold apples worth extra points appear occasionally.
- Speed apples give a temporary speed boost.
- Ghost apples let you pass through obstacles briefly.
- Additional apples appear at random while playing.
- Difficulty levels adjust speed and add obstacles.
- Choose from multiple visual themes.
- Leaderboards are stored per difficulty and include player names.
- The theme defaults to dark when your system prefers it.
- Battle against multiple AI-controlled snakes.
- AI-controlled snakes start by hunting apples to grow but increasingly try to
  hunt the player as they get bigger.
- The AI snakes can eliminate each other for a free-for-all battle.
- AI snakes spawn at random locations for a new challenge each game.

Enjoy!

## Setup

Make sure Node.js and npm are installed on your system. If you're on
Debian/Ubuntu you can install them with:

```bash
sudo apt-get update && sudo apt-get install -y nodejs npm
```

Once Node.js is available, run `./setup.sh` to install the project
dependencies and perform an `npm audit` while network access is still
available. The audit results are saved to `audit.log`. After running the
script you can start a local web server with:

```bash
npm run serve
```

Then open the provided URL in your browser to play the game locally.

### Online scores

The game tries to submit scores, including player names, to a placeholder
endpoint.

#### Using a real backend

Open `script.js` and change the value of the `SCORE_API` constant near the top of
the file to the address of your server. Removing the calls to `postScoreOnline`
will disable online score submission entirely.
