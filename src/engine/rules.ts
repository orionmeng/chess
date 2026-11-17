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
import type {
  CastleSide, Color, GameState, Move, Piece, Position, PromotionPieceType, Square,
} from './types';

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
// Returns [] for an empty square or inactive piece.
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

// Expand promotion destinations into four moves and attach castling metadata.
export function getAllLegalMoves(game: GameState): Move[] {
  const moves: Move[] = [];
  const promotions: PromotionPieceType[] = ['queen', 'rook', 'bishop', 'knight'];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const from = { row, col };
      const piece = getPieceAt(game.board, from, BOARD_SIZE);
      if (!piece || piece.color !== game.activeColor) continue;
      for (const to of getLegalMoves(game, from)) {
        if (piece.type === 'pawn' && (to.row === 0 || to.row === BOARD_SIZE - 1)) {
          for (const promotion of promotions) moves.push({ from, to, promotion });
        } else if (piece.type === 'king' && Math.abs(to.col - col) === 2) {
          moves.push({ from, to, castle: to.col === 6 ? 'kingSide' : 'queenSide' });
        } else {
          moves.push({ from, to });
        }
      }
    }
  }
  return moves;
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

function hasLegalMove(game: GameState): boolean {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const square = { row, col };
      const piece = getPieceAt(game.board, square, BOARD_SIZE);
      if (piece?.color === game.activeColor && getLegalMoves(game, square).length > 0) {
        return true;
      }
    }
  }
  return false;
}

// These functions classify the player whose turn it is, and throw if their king is missing.
export function isCheckmate(game: GameState): boolean {
  return isInCheck(game, game.activeColor) && !hasLegalMove(game);
}

export function isStalemate(game: GameState): boolean {
  return !isInCheck(game, game.activeColor) && !hasLegalMove(game);
}

function legalEnPassantTarget(position: Position): Square | null {
  const target = position.enPassantTarget;
  if (!target || getPieceAt(position.board, target, BOARD_SIZE)) {
    return null;
  }

  const row = target.row + (position.activeColor === 'white' ? -1 : 1);
  const game: GameState = { ...position, history: [], positionHistory: [] };
  for (const col of [target.col - 1, target.col + 1]) {
    const from = { row, col };
    const piece = getPieceAt(position.board, from, BOARD_SIZE);
    if (piece?.type === 'pawn' && piece.color === position.activeColor
      && getLegalMoves(game, from).some(move => move.row === target.row && move.col === target.col)) {
      return target;
    }
  }
  return null;
}

function samePosition(first: Position, second: Position): boolean {
  if (first.activeColor !== second.activeColor
    || first.board.length !== second.board.length
    || first.board.some((piece, index) =>
      piece?.type !== second.board[index]?.type || piece?.color !== second.board[index]?.color)
    || first.castlingRights.whiteKingSide !== second.castlingRights.whiteKingSide
    || first.castlingRights.whiteQueenSide !== second.castlingRights.whiteQueenSide
    || first.castlingRights.blackKingSide !== second.castlingRights.blackKingSide
    || first.castlingRights.blackQueenSide !== second.castlingRights.blackQueenSide) {
    return false;
  }

  const firstTarget = legalEnPassantTarget(first);
  const secondTarget = legalEnPassantTarget(second);
  return firstTarget?.row === secondTarget?.row && firstTarget?.col === secondTarget?.col;
}

function hasRepeatedPosition(game: GameState, requiredOccurrences: number): boolean {
  let occurrences = 1;
  for (const previous of game.positionHistory) {
    if (samePosition(game, previous) && ++occurrences >= requiredOccurrences) {
      return true;
    }
  }
  return false;
}

// Automatic draws apply to the current position; checkmate takes precedence.
export function isFivefoldRepetition(game: GameState): boolean {
  return hasRepeatedPosition(game, 5) && !isCheckmate(game);
}

export function isSeventyFiveMoveRule(game: GameState): boolean {
  return game.halfmoveClock >= 150 && !isCheckmate(game);
}

function positionForClaim(game: GameState, intendedMove?: Move): GameState {
  if (!intendedMove) {
    return game;
  }
  if (!getLegalMoves(game, intendedMove.from)
    .some(to => to.row === intendedMove.to.row && to.col === intendedMove.to.col)) {
    throw new Error('Intended move must be legal');
  }
  return updateGame(game, intendedMove);
}

// An intended move is checked without changing the game; invalid moves throw.
// Neither rule automatically ends the game: the player must claim the draw.
export function canClaimThreefoldRepetition(game: GameState, intendedMove?: Move): boolean {
  if (isCheckmate(game) || isStalemate(game)
    || isFivefoldRepetition(game) || isSeventyFiveMoveRule(game)) {
    return false;
  }
  return hasRepeatedPosition(positionForClaim(game, intendedMove), 3);
}

export function canClaimFiftyMoveRule(game: GameState, intendedMove?: Move): boolean {
  if (isCheckmate(game) || isStalemate(game)
    || isFivefoldRepetition(game) || isSeventyFiveMoveRule(game)) {
    return false;
  }
  return positionForClaim(game, intendedMove).halfmoveClock >= 100;
}
