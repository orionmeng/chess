import { describe, expect, it } from 'vitest';
import { createEmptyBoard } from '../../src/engine/board';
import {
  getKnightMoves,
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
  ['knight', getKnightMoves],
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

