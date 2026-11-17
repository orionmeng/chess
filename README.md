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

## Draws

The engine exposes `canClaimThreefoldRepetition` and `canClaimFiftyMoveRule` in `rules.ts`.
They check the current position, or an optional legal intended move declared before it is
played. These functions only report whether a claim is available; they do not end the game.
Repetition accounts for the side to move, castling rights, and legal en passant captures.
The fifty-move clock counts halfmoves and resets after a pawn move or capture.

`isFivefoldRepetition` and `isSeventyFiveMoveRule` report automatic draws in the current
position, with checkmate taking precedence. These checks do not themselves prevent moves;
the caller must check for game-ending states and stop play when the game ends.

`createInitialGame` initializes the clock and an empty `positionHistory`; `updateGame`
records each previous position and updates the clock. Custom game states must supply
their own clock and previous positions, or initialize them to `0` and `[]` for a new
history. Intended moves must be legal and include any required promotion or castling
metadata; an invalid intended move throws.

## History and notation

- `updateGame` records moves and prior positions; `undoMove` restores the previous
  position, counters, and repetition history. It throws if no recorded move is available.
- `parseFen` and `formatFen` import and export all six FEN fields. FEN import starts a
  new history because a FEN position does not encode the moves that led to it. Parsing
  validates FEN structure, but does not prove that the position is reachable in a game.
- `parsePgn` returns `{ game, tags }`; `formatPgn(game, tags)` exports the recorded
  mainline with SAN moves and a result. PGN supports setup/FEN tags, comments, NAGs,
  nested variations, and escape lines on import, but discards annotations and variations.
  Export adds the standard seven tags with placeholders where needed and defaults the
  result to `*`; callers provide the result rather than the engine inferring it.
  A known result that contradicts checkmate or an implemented automatic draw is rejected;
  invalid notation throws.

Custom game states must also initialize `fullmoveNumber` to 1 (or the correct FEN move
number); prior-position entries retain both counters so undo can restore them.
