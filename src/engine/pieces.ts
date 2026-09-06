// Example: board operations for a grid tactics game.
// import type { GridPosition, Unit } from './types';
//
// export function getUnitAt(
//   board: Array<Unit | null>,
//   position: GridPosition,
//   size: number,
// ): Unit | null {
//   if (position.row < 0 || position.row >= size || position.column < 0 || position.column >= size) {
//     return null;
//   }
//
//   const index = position.row * size + position.column;
//   return board[index] ?? null;
// }
//
// export function placeUnit(
//   board: Array<Unit | null>,
//   position: GridPosition,
//   size: number,
//   unit: Unit,
// ): Array<Unit | null> {
//   if (position.row < 0 || position.row >= size || position.column < 0 || position.column >= size) {
//     throw new Error('Position is outside the grid.');
//   }
//
//   const nextBoard = [...board];
//   const index = position.row * size + position.column;
//   nextBoard[index] = unit;
//   return nextBoard;
// }

import type { Square, Piece } from './types';

export function getPieceAt(
  board: Array<Piece | null>,
  square: Square,
  size: number,
): Piece | null {
  if (square.row < 0 || square.row >= size || square.col < 0 || square.col >= size) {
    return null;
  }

  const index = square.row * size + square.col;
  return board[index] ?? null;
}

export function placePiece(
  board: Array<Piece | null>,
  square: Square,
  size: number,
  piece: Piece,
): Array<Piece | null> {
  if (square.row < 0 || square.row >= size || square.col < 0 || square.col >= size) {
    throw new Error('Square is outside the board.');
  }

  const nextBoard = [...board];
  const index = square.row * size + square.col;
  nextBoard[index] = piece;
  return nextBoard;
}
