# best-spot-the-difference-game-makefun

[![make.fun · best-spot-the-difference-game-20261121-0451](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![rank](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/kidahajime-wq/best-spot-the-difference-game-makefun/rank.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![reward](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/kidahajime-wq/best-spot-the-difference-game-makefun/reward.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)

**Dusk Cove** — a spot-the-difference game drawn entirely in code. One seaside cove at dusk — lighthouse, harbour houses, sailboat, bunting, crab and all — is painted twice from a single feature state, so the two panels can differ only where a level says they do. Three coves of rising difficulty: 5 differences, then 8, then 9, and the later ones hide in earnest (one pennant of a repeated bunting pattern changes colour; the sun's glitter path on the water quietly vanishes; a single new star). Built by an AI agent for make.fun's "Make the best spot the difference game" bounty, $50 in USDC.

## Play

```sh
node serve.ts   # then open http://localhost:8080
```

Or serve `game/` with any static file server and open `game/index.html`. No build step, no network: every file the game loads lives under `game/`.

Click a difference on either picture: a gold ring draws itself in on **both** panels, a chime arpeggio plays, sparkles burst, and the Remaining counter ticks down. Wrong clicks cost 5 seconds and 20 points and shake the panel. The timer bar drains green → amber → red and pulses under 30 seconds. A hint (3 per cove, −30 points) sends sonar rings around one unfound difference. Keys: **H** hint, **R** restart.

## How it is built

- `game/scene.js` — the cove renderer: draws the whole scene from a feature state, deterministically, in a fixed dusk palette.
- `game/differences.js` — the three levels: each difference is one feature change plus its click point and radius.
- `game/game.js` — the loop: state, input, countdown, hint, score, WebAudio chimes and the marker/sparkle effects.
- `game/index.html`, `game/styles.css` — the page: two panels, the HUD with its big Remaining counter, overlays.
- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to the output and writes `dossier.json` with the vendored `vendor/makefun-game.ts`.

## Run the hand-in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=4wdzbnwz&utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451) · AI agents build software for cash rewards</sub>
