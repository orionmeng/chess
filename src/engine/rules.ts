import { isOnBoard } from './board';
import { updateGame } from './game';
import {
  getBishopMoves,
  getKingMoves,
  getKnightMoves,
  getPawnMoves,
  getQueenMoves,
  getRookMoves,
  getPawnAttacks,
} from './moveGenerator';
import { getPieceAt } from './pieces';
import type { Color, GameState, Square } from './types';

const BOARD_SIZE = 8;

// Returns the first square containing the specified color's king, or null if none exists.
function findKing(game: GameState, color: Color): Square | null {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = getPieceAt(game.board, { row, col }, BOARD_SIZE);
      if (piece && piece.type === 'king' && piece.color === color) {
        return { row, col };
      }
    }
  }
  return null;
}

// Returns candidate destinations without checking king safety, or [] for an empty square.
function getPotentialMoves(game: GameState, square: Square): Square[] {
  const piece = getPieceAt(game.board, square, BOARD_SIZE);
  if (!piece) {
    return [];
  }

  switch (piece.type) {
    case 'pawn':
      return getPawnMoves(game, square);
    case 'rook':
      return getRookMoves(game, square);
    case 'knight':
      return getKnightMoves(game, square);
    case 'bishop':
      return getBishopMoves(game, square);
    case 'queen':
      return getQueenMoves(game, square);
    case 'king':
      return getKingMoves(game, square);
    default:
      return [];
  }
}

// Returns candidate destinations that neither capture a king nor leave the moving player's king in check.
// Returns [] for an empty square or inactive piece; special moves are not yet supported.
export function getLegalMoves(game: GameState, square: Square): Square[] {
  const piece = getPieceAt(game.board, square, BOARD_SIZE);
  if (!piece || game.activeColor !== piece.color) {
    return [];
  }

  const potentialMoves = getPotentialMoves(game, square);

  return potentialMoves.filter(move => {
    if (getPieceAt(game.board, move, BOARD_SIZE)?.type === 'king') {
      return false;
    }

    const newGame = updateGame(game, { from: square, to: move });
    return !isInCheck(newGame, piece.color);
  });
}

// Checks whether attackerColor attacks the square, regardless of occupancy or pins.
// Throws if the square is outside the board or has non-integer coordinates.
export function isSquareAttacked(game: GameState, square: Square, attackerColor: Color): boolean {
  if (!Number.isInteger(square.row) || !Number.isInteger(square.col)) {
    throw new Error('Square coordinates must be integers.');
  }

  if (!isOnBoard(square)) {
    throw new Error('Square is outside the board.');
  }

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = getPieceAt(game.board, { row, col }, BOARD_SIZE);
      if (piece && piece.color === attackerColor) {
        const rowDistance = square.row - row;
        const colDistance = square.col - col;
        const absRow = Math.abs(rowDistance);
        const absCol = Math.abs(colDistance);

        if (piece.type === 'pawn' && getPawnAttacks(game, { row, col })
          .some(attack => attack.row === square.row && attack.col === square.col)) {
          return true;
        }
        if (piece.type === 'knight' &&
          ((absRow === 2 && absCol === 1) || (absRow === 1 && absCol === 2))) {
          return true;
        }
        if (piece.type === 'king' && Math.max(absRow, absCol) === 1) {
          return true;
        }

        const straight = (absRow === 0) !== (absCol === 0);
        const diagonal = absRow > 0 && absRow === absCol;
        const followsRay =
          (piece.type === 'rook' && straight) ||
          (piece.type === 'bishop' && diagonal) ||
          (piece.type === 'queen' && (straight || diagonal));

        if (followsRay) {
          const rowStep = Math.sign(rowDistance);
          const colStep = Math.sign(colDistance);
          let currentRow = row + rowStep;
          let currentCol = col + colStep;

          while (currentRow !== square.row || currentCol !== square.col) {
            if (getPieceAt(game.board, { row: currentRow, col: currentCol }, BOARD_SIZE)) {
              break;
            }
            currentRow += rowStep;
            currentCol += colStep;
          }

          if (currentRow === square.row && currentCol === square.col) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

// Finds the specified king and checks whether the opposing color attacks its square.
// Throws if the king is missing from the board.
export function isInCheck(game: GameState, color: Color): boolean {
  const kingSquare = findKing(game, color);
  if (!kingSquare) {
    throw new Error('King not found on the board');
  }
  return isSquareAttacked(game, kingSquare, color === 'white' ? 'black' : 'white');
}
