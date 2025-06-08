# Tank Control (2018 7-Day Roguelike Challenge Entry)

![title](https://github.com/user-attachments/assets/0512b6f5-1242-426e-a624-3cce4571db75)

[Play on Itch.io](https://heroicfisticuffs.itch.io/tankcontrol)

[How to Play](http://blog.heroicfisticuffs.com/tank-control-a-2018-7drl-success/)

My submission for the [2018 7-Day Roguelike Challenge](https://itch.io/jam/7drl-challenge-2018). *Tank Control* is an experimental roguelike with traditional mechanics combined where you control a WWII-style tank. Tank movement and Turret movement are handled separately, and rotating the tank takes a turn, forcing some tactical decision making.

Based on a now-obsolete fork of the original [2017 7-Day Rogueliek Challenge Entry - Hardpointe (now known as Warning Call)](https://warningcall.space/) codebase.

# See Also

[rotjs-bare-bones](https://github.com/twpage/rotjs-bare-bones) for an actual bare bones repo that simply gets rot.js running on a static HTML page.

[rotjs-basic-bones](https://github.com/twpage/rotjs-basic-bones) for a slightly fancier version of the above with more hooks for actual gameplay, a direct descendent of this 2018 roguelike challenge entry.

# NPM Setup

npm init
npm install --save-dev typescript webpack ts-loader css-loader @types/rot-js rot-js postal @types/postal

```

# Build & Run Server

npm run build -- --watch
