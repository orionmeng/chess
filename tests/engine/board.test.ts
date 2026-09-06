import { describe, expect, it } from 'vitest';
import { createEmptyBoard, isOnBoard, squareToIndex } from '../../src/engine/board';

describe('createEmptyBoard', () => {
  it('creates 64 empty squares', () => {
    const board = createEmptyBoard();
    expect(board).toHaveLength(64);
    expect(board.every((square) => square === null)).toBe(true);
  });
});

describe('isOnBoard', () => {
  it('accepts a square within the board', () => {
    expect(isOnBoard({ row: 6, col: 7 })).toBe(true);
  });
  it('rejects a square outside the board', () => {
    expect(isOnBoard({ row: 5, col: 8 })).toBe(false);
  });
});

describe('squareToIndex', () => {
  it('converts a valid square to a flat-array index', () => {
    expect(squareToIndex({ row: 6, col: 7 })).toBe(55);
  });
  it('throws for an invalid square', () => {
    expect(() => squareToIndex({ row: 1, col: 8 })).toThrow();
  });
});
