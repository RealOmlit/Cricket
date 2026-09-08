# Cricket Masters

A playable 3D cricket game built with React, TypeScript, Three.js and Vinext.

Chase 24 runs in 12 balls against the Royals XI. Includes articulated players, a stadium crowd, HDR sky lighting, PBR turf and pitch textures, directional batting, catches, boundary scoring, ball physics, sound, and local personal-best tracking.

## Run locally

Requires Node.js 22.13 or later.

```sh
npm install
npm run dev
```

Open the local URL printed by the development server.

## Controls

- Space: swing
- A / D or left / right arrows: aim
- L: switch ground / lofted shot
- P: pause
- C: camera view

On-screen controls support touch devices.

## Build and validate

```sh
npm run build
npx tsc --noEmit
node --experimental-strip-types --test tests/rules.test.mjs
```

The project-wide lint command currently reports pre-existing issues in bundled UI components. Game-specific lint checks:

```sh
npx oxlint app lib/cricket-game.ts lib/cricket-rules.ts lib/athlete.ts lib/stadium-realism.ts
```

## Assets

The included sky and surface textures are provided by Poly Haven under CC0. See `public/asset-credits.txt` for sources.

## Scope

A single-player two-over chase game. This version does not include multiplayer or a complete cricket tournament simulation.

The hosting configuration has no account-specific project ID. Register your own project when deploying through Sites.
