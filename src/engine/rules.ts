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
import { getPieceAt, removePiece } from './pieces';
import type { CastleSide, Color, GameState, Piece, Square } from './types';

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

function getCastlingCandidates(
  game: GameState,
  from: Square,
  piece: Piece,
): Array<{ to: Square; castle: CastleSide }> {
  if (piece.type !== 'king') {
    return [];
  }

  const homeRow = piece.color === 'white' ? 0 : BOARD_SIZE - 1;
  if (from.row !== homeRow || from.col !== 4) {
    return [];
  }

  const enemyColor = piece.color === 'white' ? 'black' : 'white';
  const sides: CastleSide[] = ['kingSide', 'queenSide'];
  const candidates: Array<{ to: Square; castle: CastleSide }> = [];

  for (const side of sides) {
    const isKingSide = side === 'kingSide';
    const right = piece.color === 'white'
      ? (isKingSide ? game.castlingRights.whiteKingSide : game.castlingRights.whiteQueenSide)
      : (isKingSide ? game.castlingRights.blackKingSide : game.castlingRights.blackQueenSide);
    if (!right) {
      continue;
    }

    const rookSquare = { row: homeRow, col: isKingSide ? 7 : 0 };
    const rook = getPieceAt(game.board, rookSquare, BOARD_SIZE);
    if (rook?.type !== 'rook' || rook.color !== piece.color) {
      continue;
    }

    const emptyCols = isKingSide ? [5, 6] : [1, 2, 3];
    if (emptyCols.some(col => getPieceAt(game.board, { row: homeRow, col }, BOARD_SIZE))) {
      continue;
    }

    const kingPathCols = isKingSide ? [4, 5, 6] : [4, 3, 2];
    const boardWithoutKing = removePiece(game.board, from, BOARD_SIZE);
    const gameWithoutKing = { ...game, board: boardWithoutKing };
    if (kingPathCols.some(col =>
      isSquareAttacked(gameWithoutKing, { row: homeRow, col }, enemyColor))) {
      continue;
    }

    candidates.push({
      to: { row: homeRow, col: isKingSide ? 6 : 2 },
      castle: side,
    });
  }

  return candidates;
}

// Returns candidate destinations that neither capture a king nor leave the moving player's king in check.
// Returns [] for an empty square or inactive piece; en passant is not yet supported.
// Promotion destinations are returned once; the caller must choose the promotion piece.
export function getLegalMoves(game: GameState, square: Square): Square[] {
  const piece = getPieceAt(game.board, square, BOARD_SIZE);
  if (!piece || game.activeColor !== piece.color) {
    return [];
  }

  const potentialMoves: Array<{ to: Square; castle?: CastleSide }> =
    getPotentialMoves(game, square).map(to => ({ to }));
  potentialMoves.push(...getCastlingCandidates(game, square, piece));

  return potentialMoves.filter(candidate => {
    if (getPieceAt(game.board, candidate.to, BOARD_SIZE)?.type === 'king') {
      return false;
    }

    const promotionRow = piece.color === 'white' ? BOARD_SIZE - 1 : 0;
    // The chosen promotion piece does not affect whether the moving king is safe on this destination.
    const promotion = piece.type === 'pawn' && candidate.to.row === promotionRow ? 'queen' : undefined;
    const newGame = updateGame(game, {
      from: square,
      to: candidate.to,
      promotion,
      castle: candidate.castle,
    });
    return !isInCheck(newGame, piece.color);
  }).map(candidate => candidate.to);
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
