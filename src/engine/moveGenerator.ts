import { isOnBoard } from './board';
import { getPieceAt } from './pieces';
import type { GameState, Square } from './types';

const BOARD_SIZE = 8;

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
  const piece = getPieceAt(game.board, from, BOARD_SIZE);
  if (piece?.type !== 'knight') {
    return [];
  }

  const moves: Square[] = [];

  for (const direction of L_DIRECTIONS) {
    const destination: Square = { row: from.row + direction.row, col: from.col + direction.col };

    if (isOnBoard(destination)) {
      const occupant = getPieceAt(game.board, destination, BOARD_SIZE);

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
  const piece = getPieceAt(game.board, from, BOARD_SIZE);
  if (piece?.type !== 'bishop') {
    return [];
  }

  const moves: Square[] = [];

  for (const direction of DIAGONAL_DIRECTIONS) {
    let current: Square = { row: from.row + direction.row, col: from.col + direction.col };

    while (isOnBoard(current)) {
      const occupant = getPieceAt(game.board, current, BOARD_SIZE);

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
  const piece = getPieceAt(game.board, from, BOARD_SIZE);
  if (piece?.type !== 'rook') {
    return [];
  }

  const moves: Square[] = [];

  for (const direction of STRAIGHT_DIRECTIONS) {
    let current: Square = { row: from.row + direction.row, col: from.col + direction.col };

    while (isOnBoard(current)) {
      const occupant = getPieceAt(game.board, current, BOARD_SIZE);

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
  const piece = getPieceAt(game.board, from, BOARD_SIZE);
  if (piece?.type !== 'queen') {
    return [];
  }

  const moves: Square[] = [];

  for (const direction of STRAIGHT_DIRECTIONS) {
    let current: Square = { row: from.row + direction.row, col: from.col + direction.col };

    while (isOnBoard(current)) {
      const occupant = getPieceAt(game.board, current, BOARD_SIZE);

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
      const occupant = getPieceAt(game.board, current, BOARD_SIZE);

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

export function getKingMoves(game: GameState, from: Square): Square[] {
  const piece = getPieceAt(game.board, from, BOARD_SIZE);
  if (piece?.type !== 'king') {
    return [];
  }

  const moves: Square[] = [];

  for (const direction of STRAIGHT_DIRECTIONS) {
    const destination: Square = { row: from.row + direction.row, col: from.col + direction.col };

    if (isOnBoard(destination)) {
      const occupant = getPieceAt(game.board, destination, BOARD_SIZE);

      if (!occupant) {
        moves.push(destination);
      } else if (occupant.color !== piece.color) {
        moves.push(destination);
      }
    }
  }

  for (const direction of DIAGONAL_DIRECTIONS) {
    const destination: Square = { row: from.row + direction.row, col: from.col + direction.col };

    if (isOnBoard(destination)) {
      const occupant = getPieceAt(game.board, destination, BOARD_SIZE);

      if (!occupant) {
        moves.push(destination);
      } else if (occupant.color !== piece.color) {
        moves.push(destination);
      }
    }
  }

  return moves;
}

export function getPawnMoves(game: GameState, from: Square): Square[] {
  const piece = getPieceAt(game.board, from, BOARD_SIZE);
  if (piece?.type !== 'pawn') {
    return [];
  }

  const moves: Square[] = [];

  if (piece.color === 'white') {
    const oneStep: Square = { row: from.row + 1, col: from.col };
    if (isOnBoard(oneStep) && !getPieceAt(game.board, oneStep, BOARD_SIZE)) {
      moves.push(oneStep);
      const twoStep: Square = { row: from.row + 2, col: from.col };
      if (from.row === 1 && !getPieceAt(game.board, twoStep, BOARD_SIZE)) {
        moves.push(twoStep);
      }
    }
  } else {
    const oneStep: Square = { row: from.row - 1, col: from.col };
    if (isOnBoard(oneStep) && !getPieceAt(game.board, oneStep, BOARD_SIZE)) {
      moves.push(oneStep);
      const twoStep: Square = { row: from.row - 2, col: from.col };
      if (from.row === BOARD_SIZE - 2 && !getPieceAt(game.board, twoStep, BOARD_SIZE)) {
        moves.push(twoStep);
      }
    }
  }

  const potentialAttacks = getPawnAttacks(game, from);
  for (const attack of potentialAttacks) {
    const occupant = getPieceAt(game.board, attack, BOARD_SIZE);
    if (occupant && occupant.color !== piece.color) {
      moves.push(attack);
    }
  }

  return moves;
}

export function getPawnAttacks(game: GameState, from: Square): Square[] {
  const piece = getPieceAt(game.board, from, BOARD_SIZE);
  if (piece?.type !== 'pawn') {
    return [];
  }

  const attacks: Square[] = [];
  const direction = piece.color === 'white' ? 1 : -1;

  const captureLeft: Square = { row: from.row + direction, col: from.col - 1 };
  if (isOnBoard(captureLeft)) {
    attacks.push(captureLeft);
  }

  const captureRight: Square = { row: from.row + direction, col: from.col + 1 };
  if (isOnBoard(captureRight)) {
    attacks.push(captureRight);
  }

  return attacks;
}
