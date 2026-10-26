import { describe, expect, it } from 'vitest';
import { createEmptyBoard } from '../../src/engine/board';
import {
  getBishopMoves,
  getKingMoves,
  getKnightMoves,
  getQueenMoves,
  getRookMoves,
} from '../../src/engine/moveGenerator';
import { placePiece } from '../../src/engine/pieces';
import type { Color, GameState, Piece, Square } from '../../src/engine/types';

const BOARD_SIZE = 8;

function square(row: number, col: number): Square {
  return { row, col };
}

function piece(type: Piece['type'], color: Color = 'white'): Piece {
  return { type, color };
}

function createGame(entries: Array<[Square, Piece]> = []): GameState {
  let board = createEmptyBoard();
  for (const [position, occupant] of entries) {
    board = placePiece(board, position, BOARD_SIZE, occupant);
  }

  return { activeColor: 'white', board, history: [] };
}

function sorted(squares: Square[]): Square[] {
  return [...squares].sort((a, b) => a.row - b.row || a.col - b.col);
}

function expectMoves(actual: Square[], expected: Square[]): void {
  expect(sorted(actual)).toEqual(sorted(expected));
}

const generators = [
  ['rook', getRookMoves],
  ['knight', getKnightMoves],
  ['bishop', getBishopMoves],
  ['queen', getQueenMoves],
  ['king', getKingMoves],
] as const;

describe.each(generators)('get%sMoves', (type, getMoves) => {
  it('returns no moves when the source square contains a different piece', () => {
    const game = createGame([[square(3, 3), piece(type === 'pawn' ? 'king' : 'pawn')]]);

    expect(getMoves(game, square(3, 3))).toEqual([]);
  });

  it('returns no moves when the source square is empty', () => {
    expect(getMoves(createGame(), square(3, 3))).toEqual([]);
  });
});

describe('getKnightMoves', () => {
  it('generates all eight L-shaped moves from the center of an empty board', () => {
    const game = createGame([[square(3, 3), piece('knight')]]);

    expectMoves(getKnightMoves(game, square(3, 3)), [
      square(1, 2),
      square(1, 4),
      square(2, 1),
      square(2, 5),
      square(4, 1),
      square(4, 5),
      square(5, 2),
      square(5, 4),
    ]);
  });

  it('can capture an opposing piece but not land on a friendly piece', () => {
    const game = createGame([
      [square(3, 3), piece('knight')],
      [square(1, 2), piece('pawn')],
      [square(5, 4), piece('pawn', 'black')],
    ]);

    const moves = getKnightMoves(game, square(3, 3));
    expect(moves).toHaveLength(7);
    expect(moves).not.toContainEqual(square(1, 2));
    expect(moves).toContainEqual(square(5, 4));
  });

  it('keeps all moves on the board when the knight is in a corner', () => {
    const game = createGame([[square(0, 0), piece('knight')]]);

    expectMoves(getKnightMoves(game, square(0, 0)), [square(1, 2), square(2, 1)]);
  });
});

describe('getBishopMoves', () => {
  it('moves along all four diagonals until reaching the board edge', () => {
    const game = createGame([[square(3, 3), piece('bishop')]]);

    expectMoves(getBishopMoves(game, square(3, 3)), [
      square(0, 0),
      square(0, 6),
      square(1, 1),
      square(1, 5),
      square(2, 2),
      square(2, 4),
      square(4, 2),
      square(4, 4),
      square(5, 1),
      square(5, 5),
      square(6, 0),
      square(6, 6),
      square(7, 7),
    ]);
  });

  it('can capture an opposing piece but stops at either color of blocker', () => {
    const game = createGame([
      [square(3, 3), piece('bishop')],
      [square(1, 1), piece('pawn')],
      [square(5, 5), piece('pawn', 'black')],
    ]);

    expectMoves(getBishopMoves(game, square(3, 3)), [
      square(2, 2),
      square(2, 4),
      square(1, 5),
      square(0, 6),
      square(4, 2),
      square(5, 1),
      square(6, 0),
      square(4, 4),
      square(5, 5),
    ]);
  });
});

describe('getRookMoves', () => {
  it('moves along all four straight directions until reaching the board edge', () => {
    const game = createGame([[square(3, 3), piece('rook')]]);

    expectMoves(getRookMoves(game, square(3, 3)), [
      square(0, 3),
      square(1, 3),
      square(2, 3),
      square(4, 3),
      square(5, 3),
      square(6, 3),
      square(7, 3),
      square(3, 0),
      square(3, 1),
      square(3, 2),
      square(3, 4),
      square(3, 5),
      square(3, 6),
      square(3, 7),
    ]);
  });

  it('can capture an opposing piece but stops at either color of blocker', () => {
    const game = createGame([
      [square(3, 3), piece('rook')],
      [square(1, 3), piece('pawn')],
      [square(3, 5), piece('pawn', 'black')],
    ]);

    expectMoves(getRookMoves(game, square(3, 3)), [
      square(2, 3),
      square(4, 3),
      square(5, 3),
      square(6, 3),
      square(7, 3),
      square(3, 2),
      square(3, 1),
      square(3, 0),
      square(3, 4),
      square(3, 5),
    ]);
  });
});

describe('getQueenMoves', () => {
  it('moves in straight and diagonal directions without leaving the board', () => {
    const game = createGame([[square(3, 3), piece('queen')]]);
    const moves = getQueenMoves(game, square(3, 3));

    expect(moves).toHaveLength(27);
    expect(moves).toContainEqual(square(0, 3));
    expect(moves).toContainEqual(square(7, 3));
    expect(moves).toContainEqual(square(3, 0));
    expect(moves).toContainEqual(square(3, 7));
    expect(moves).toContainEqual(square(0, 0));
    expect(moves).toContainEqual(square(7, 7));
    expect(moves.every(({ row, col }) => row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE)).toBe(true);
  });

  it('can capture an opposing piece but stops at either color of blocker', () => {
    const game = createGame([
      [square(3, 3), piece('queen')],
      [square(1, 3), piece('pawn')],
      [square(3, 5), piece('pawn', 'black')],
      [square(1, 1), piece('pawn')],
      [square(5, 5), piece('pawn', 'black')],
    ]);
    const moves = getQueenMoves(game, square(3, 3));

    expect(moves).toContainEqual(square(2, 3));
    expect(moves).not.toContainEqual(square(1, 3));
    expect(moves).toContainEqual(square(3, 4));
    expect(moves).toContainEqual(square(3, 5));
    expect(moves).not.toContainEqual(square(3, 6));
    expect(moves).toContainEqual(square(2, 2));
    expect(moves).not.toContainEqual(square(1, 1));
    expect(moves).toContainEqual(square(4, 4));
    expect(moves).toContainEqual(square(5, 5));
    expect(moves).not.toContainEqual(square(6, 6));
  });
});

describe('getKingMoves', () => {
  it('moves one square in any direction from the center of an empty board', () => {
    const game = createGame([[square(3, 3), piece('king')]]);

    expectMoves(getKingMoves(game, square(3, 3)), [
      square(2, 2),
      square(2, 3),
      square(2, 4),
      square(3, 2),
      square(3, 4),
      square(4, 2),
      square(4, 3),
      square(4, 4),
    ]);
  });

  it('can capture an opposing piece but not move onto a friendly piece', () => {
    const game = createGame([
      [square(3, 3), piece('king')],
      [square(2, 3), piece('pawn')],
      [square(4, 4), piece('pawn', 'black')],
    ]);
    const moves = getKingMoves(game, square(3, 3));

    expect(moves).toHaveLength(7);
    expect(moves).not.toContainEqual(square(2, 3));
    expect(moves).toContainEqual(square(4, 4));
  });

  it('keeps all moves on the board when the king is in a corner', () => {
    const game = createGame([[square(0, 0), piece('king')]]);

    expectMoves(getKingMoves(game, square(0, 0)), [
      square(0, 1),
      square(1, 0),
      square(1, 1),
    ]);
  });
});

