import { isOnBoard } from './board';
import { getPieceAt } from './pieces';
import type { GameState, Square } from './types';
// import type { GameState, Piece, Square } from './types';

const STRAIGHT_DIRECTIONS = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
];

const DIAGONAL_DIRECTIONS = [
  { row: -1, col: -1 },
  { row: -1, col: 1 },
  { row: 1, col: -1 },
  { row: 1, col: 1 },
];

const L_DIRECTIONS = [
  { row: -2, col: -1 },
  { row: -2, col: 1 },
  { row: -1, col: -2 },
  { row: -1, col: 2 },
  { row: 1, col: -2 },
  { row: 1, col: 2 },
  { row: 2, col: -1 },
  { row: 2, col: 1 },
];

export function getKnightMoves(game: GameState, from: Square): Square[] {
  const piece = getPieceAt(game.board, from, 8);
  if (piece?.type !== 'knight') {
    return [];
  }

  const moves: Square[] = [];

  for (const direction of L_DIRECTIONS) {
    const destination: Square = { row: from.row + direction.row, col: from.col + direction.col };

    if (isOnBoard(destination)) {
      const occupant = getPieceAt(game.board, destination, 8);

      if (!occupant) {
        moves.push(destination);
      } else if (occupant.color !== piece.color) {
        moves.push(destination);
      }
    }
  }

  return moves;
}

export function getBishopMoves(game: GameState, from: Square): Square[] {
  const piece = getPieceAt(game.board, from, 8);
  if (piece?.type !== 'bishop') {
    return [];
  }

  const moves: Square[] = [];

  for (const direction of DIAGONAL_DIRECTIONS) {
    let current: Square = { row: from.row + direction.row, col: from.col + direction.col };

    while (isOnBoard(current)) {
      const occupant = getPieceAt(game.board, current, 8);

      if (!occupant) {
        moves.push(current);
      } else {
        if (occupant.color !== piece.color) {
          moves.push(current);
        }
        break;
      }

      current = { row: current.row + direction.row, col: current.col + direction.col };
    }
  }

  return moves;
}

export function getRookMoves(game: GameState, from: Square): Square[] {
  const piece = getPieceAt(game.board, from, 8);
  if (piece?.type !== 'rook') {
    return [];
  }

  const moves: Square[] = [];

  for (const direction of STRAIGHT_DIRECTIONS) {
    let current: Square = { row: from.row + direction.row, col: from.col + direction.col };

    while (isOnBoard(current)) {
      const occupant = getPieceAt(game.board, current, 8);

      if (!occupant) {
        moves.push(current);
      } else {
        if (occupant.color !== piece.color) {
          moves.push(current);
        }
        break;
      }

      current = { row: current.row + direction.row, col: current.col + direction.col };
    }
  }

  return moves;
}

export function getQueenMoves(game: GameState, from: Square): Square[] {
  const piece = getPieceAt(game.board, from, 8);
  if (piece?.type !== 'queen') {
    return [];
  }

  const moves: Square[] = [];

  for (const direction of STRAIGHT_DIRECTIONS) {
    let current: Square = { row: from.row + direction.row, col: from.col + direction.col };

    while (isOnBoard(current)) {
      const occupant = getPieceAt(game.board, current, 8);

      if (!occupant) {
        moves.push(current);
      } else {
        if (occupant.color !== piece.color) {
          moves.push(current);
        }
        break;
      }

      current = { row: current.row + direction.row, col: current.col + direction.col };
    }
  }

  for (const direction of DIAGONAL_DIRECTIONS) {
    let current: Square = { row: from.row + direction.row, col: from.col + direction.col };

    while (isOnBoard(current)) {
      const occupant = getPieceAt(game.board, current, 8);

      if (!occupant) {
        moves.push(current);
      } else {
        if (occupant.color !== piece.color) {
          moves.push(current);
        }
        break;
      }

      current = { row: current.row + direction.row, col: current.col + direction.col };
    }
  }

  return moves;
}
