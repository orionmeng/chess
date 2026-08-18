# Chess

A chess game built from scratch for learning purposes: rules engine, AI opponent, and a web UI.

## Stack

- TypeScript
- Vite (dev server / build)
- Vitest (testing)

## Project structure

```
src/
  engine/   # Pure game logic: board, move generation, rules, notation (no DOM)
  ai/       # Move evaluation and search (minimax + alpha-beta)
  ui/       # DOM rendering and input handling
tests/
  engine/   # Unit tests for the rules engine
```

## Getting started

```
npm install
npm run dev
```

## Scripts

- `npm run dev` — start the Vite dev server
- `npm run build` — type-check and build for production
- `npm run preview` — preview the production build
- `npm test` — run tests with Vitest
