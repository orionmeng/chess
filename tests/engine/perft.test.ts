import { describe, expect, it } from 'vitest';
import { createInitialGame, updateGame } from '../../src/engine/game';
import { parseFen } from '../../src/engine/notation';
import { getPieceAt } from '../../src/engine/pieces';
import { getAllLegalMoves } from '../../src/engine/rules';
import type { GameState, Move } from '../../src/engine/types';

function perft(game: GameState, depth: number): number {
  if (depth === 0) return 1;
  const moves = getAllLegalMoves(game);
  if (depth === 1) return moves.length;
  return moves.reduce((count, move) => count + perft(updateGame(game, move), depth - 1), 0);
}

function moveLabel(move: Move): string {
  const square = ({ row, col }: Move['from']) => `${'abcdefgh'[col]}${row + 1}`;
  const promotion = move.promotion ? `=${move.promotion}` : '';
  return `${square(move.from)}${square(move.to)}${promotion}`;
}

function countEnPassantAtLeaf(game: GameState, depth: number): number {
  const moves = getAllLegalMoves(game);
  if (depth === 1) {
    return moves.filter(move =>
      getPieceAt(game.board, move.from, 8)?.type === 'pawn'
      && move.from.col !== move.to.col
      && !getPieceAt(game.board, move.to, 8)).length;
  }
  return moves.reduce((count, move) =>
    count + countEnPassantAtLeaf(updateGame(game, move), depth - 1), 0);
}

function expectPerft(game: GameState, depth: number, expected: number): void {
  const count = perft(game, depth);
  if (count !== expected && depth > 0) {
    const divide = getAllLegalMoves(game).map(move =>
      `${moveLabel(move)}: ${perft(updateGame(game, move), depth - 1)}`).join('\n');
    expect(count, `Perft divide:\n${divide}`).toBe(expected);
  } else {
    expect(count).toBe(expected);
  }
}

// Reference positions and totals: https://www.chessprogramming.org/Perft_Results
describe('perft', () => {
  it.each([
    [0, 1], [1, 20], [2, 400], [3, 8902], [4, 197281],
  ])('counts initial-position sequences at depth %i', (depth, expected) => {
    expectPerft(createInitialGame(), depth, expected);
  }, 30000);

  it.each([
    [1, 48], [2, 2039], [3, 97862],
  ])('counts Kiwipete castling and en passant sequences at depth %i', (depth, expected) => {
    const game = parseFen('r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1');
    expectPerft(game, depth, expected);
  }, 30000);

  it('includes both castling moves in Kiwipete', () => {
    const game = parseFen('r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1');
    expect(getAllLegalMoves(game).filter(move => move.castle).map(move => move.castle).sort())
      .toEqual(['kingSide', 'queenSide']);
  });

  it.each([
    [1, 14], [2, 191], [3, 2812], [4, 43238],
  ])('counts rook and pawn endgame sequences at depth %i', (depth, expected) => {
    const game = parseFen('8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1');
    expectPerft(game, depth, expected);
  }, 30000);

  it('counts the two en passant captures at depth 3 in the rook and pawn endgame', () => {
    const game = parseFen('8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1');
    expect(countEnPassantAtLeaf(game, 3)).toBe(2);
  });

  it.each([
    ['white', 'r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1'],
    ['black', 'r2q1rk1/pP1p2pp/Q4n2/bbp1p3/Np6/1B3NBn/pPPP1PPP/R3K2R b KQ - 0 1'],
  ])('counts promotion and check-evasion sequences for %s', (_color, fen) => {
    const game = parseFen(fen);
    for (const [depth, expected] of [[1, 6], [2, 264], [3, 9467]]) {
      expectPerft(game, depth, expected);
    }
  }, 30000);

  it('counts all four promotion choices from a shared destination', () => {
    const game = parseFen('rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8');
    expectPerft(game, 1, 44);
    expectPerft(game, 2, 1486);
    expect(getAllLegalMoves(game)
      .filter(move => move.from.row === 6 && move.from.col === 3 && move.to.row === 7 && move.to.col === 2)
      .map(move => move.promotion).sort()).toEqual(['bishop', 'knight', 'queen', 'rook']);
  });
});
