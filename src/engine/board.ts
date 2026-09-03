// Example: helpers for an 8x8 grid tactics game.
// import type { GridPosition, Unit } from './types';
//
// const GRID_SIZE = 8;
//
// export function createEmptyGrid(): Array<Unit | null> {
//   return Array(GRID_SIZE * GRID_SIZE).fill(null);
// }
//
// export function isOnGrid(position: GridPosition): boolean {
//   return (
//     position.row >= 0 &&
//     position.row < GRID_SIZE &&
//     position.column >= 0 &&
//     position.column < GRID_SIZE
//   );
// }
//
// export function positionToIndex(position: GridPosition): number {
//   if (!isOnGrid(position)) {
//     throw new Error('Position is outside the grid.');
//   }
//
//   return position.row * GRID_SIZE + position.column;
// }

import type { Square, Piece } from './types';

const BOARD_SIZE = 8;

export function createEmptyBoard(): Array<Piece | null> {
  return Array(BOARD_SIZE * BOARD_SIZE).fill(null);
}

export function isOnBoard(square: Square): boolean {
  return (
    square.row >= 0 &&
    square.row < BOARD_SIZE &&
    square.col >= 0 &&
    square.col < BOARD_SIZE
  );
}

export function squareToIndex(square: Square): number {
  if (!isOnBoard(square)) {
    throw new Error('Square is outside the board.');
  }

  return square.row * BOARD_SIZE + square.col;
}
