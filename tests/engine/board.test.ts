// Example: tests for grid tactics board helpers.
// import { describe, expect, it } from 'vitest';
// import {
//   createEmptyGrid,
//   isOnGrid,
//   positionToIndex,
// } from '../../src/engine/board';
//
// describe('createEmptyGrid', () => {
//   it('creates 64 empty cells', () => {
//     const grid = createEmptyGrid();
//
//     expect(grid).toHaveLength(64);
//     expect(grid.every((cell) => cell === null)).toBe(true);
//   });
// });
//
// describe('isOnGrid', () => {
//   it('accepts a position within the grid', () => {
//     expect(isOnGrid({ row: 4, column: 2 })).toBe(true);
//   });
//
//   it('rejects a position outside the grid', () => {
//     expect(isOnGrid({ row: 8, column: 0 })).toBe(false);
//   });
// });
//
// describe('positionToIndex', () => {
//   it('converts a grid position to a flat-array index', () => {
//     expect(positionToIndex({ row: 2, column: 3 })).toBe(19);
//   });
//
//   it('throws for a position outside the grid', () => {
//     expect(() => positionToIndex({ row: -1, column: 0 })).toThrow();
//   });
// });

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
