// Example: creating the starting state for a turn-based grid tactics game.
// This is intentionally commented out so you can translate the pattern yourself.
//
// import { createEmptyGrid } from './board';
// import { placeUnit } from './pieces';
// import type { MatchState, Unit } from './types';
//
// export function createStartingMatch(): MatchState {
//   const scout: Unit = { team: 'sun', kind: 'scout' };
//   const guardian: Unit = { team: 'moon', kind: 'guardian' };
//   let units = createEmptyGrid();
//
//   units = placeUnit(units, { row: 1, column: 2 }, 8, scout);
//   units = placeUnit(units, { row: 6, column: 5 }, 8, guardian);
//
//   return {
//     activeTeam: 'sun',
//     units,
//     previousActions: [],
//   };
// }
//
// The chess version should answer the same questions:
// - How do you create the initial board?
// - Which pieces belong on which squares?
// - Which color moves first?
// - How should an empty move history be represented?

import { createEmptyBoard, isOnBoard } from './board';
import { placePiece, getPieceAt, removePiece } from './pieces';
import type { CastleSide, CastlingRights, GameState, Piece, Move, Square } from './types';

const BOARD_SIZE = 8;

function validateMoveSquare(square: Square): void {
  if (!Number.isInteger(square.row) || !Number.isInteger(square.col)) {
    throw new Error('Square coordinates must be integers.');
  }
  if (!isOnBoard(square)) {
    throw new Error('Square is outside the board.');
  }
}

function castlingRightKey(color: 'white' | 'black', side: CastleSide): keyof CastlingRights {
  if (color === 'white') {
    return side === 'kingSide' ? 'whiteKingSide' : 'whiteQueenSide';
  }
  return side === 'kingSide' ? 'blackKingSide' : 'blackQueenSide';
}

function revokeKingCastlingRights(rights: CastlingRights, color: 'white' | 'black'): CastlingRights {
  return {
    ...rights,
    [castlingRightKey(color, 'kingSide')]: false,
    [castlingRightKey(color, 'queenSide')]: false,
  };
}

function revokeRookCastlingRight(
  rights: CastlingRights,
  color: 'white' | 'black',
  square: Square,
): CastlingRights {
  const homeRow = color === 'white' ? 0 : BOARD_SIZE - 1;
  if (square.row !== homeRow || (square.col !== 0 && square.col !== BOARD_SIZE - 1)) {
    return rights;
  }

  const side: CastleSide = square.col === 0 ? 'queenSide' : 'kingSide';
  return { ...rights, [castlingRightKey(color, side)]: false };
}

export function createInitialGame(): GameState {
  let board = createEmptyBoard();

  const whitePawn: Piece = { color: 'white', type: 'pawn' };
  const whiteRook: Piece = { color: 'white', type: 'rook' };
  const whiteKnight: Piece = { color: 'white', type: 'knight' };
  const whiteBishop: Piece = { color: 'white', type: 'bishop' };
  const whiteQueen: Piece = { color: 'white', type: 'queen' };
  const whiteKing: Piece = { color: 'white', type: 'king' };

  board = placePiece(board, { row: 0, col: 0 }, BOARD_SIZE, whiteRook);
  board = placePiece(board, { row: 0, col: 1 }, BOARD_SIZE, whiteKnight);
  board = placePiece(board, { row: 0, col: 2 }, BOARD_SIZE, whiteBishop);
  board = placePiece(board, { row: 0, col: 3 }, BOARD_SIZE, whiteQueen);
  board = placePiece(board, { row: 0, col: 4 }, BOARD_SIZE, whiteKing);
  board = placePiece(board, { row: 0, col: 5 }, BOARD_SIZE, whiteBishop);
  board = placePiece(board, { row: 0, col: 6 }, BOARD_SIZE, whiteKnight);
  board = placePiece(board, { row: 0, col: 7 }, BOARD_SIZE, whiteRook);

  for (let i = 0; i < BOARD_SIZE; i++) {
    board = placePiece(board, { row: 1, col: i }, BOARD_SIZE, whitePawn);
  }

  const blackPawn: Piece = { color: 'black', type: 'pawn' };
  const blackRook: Piece = { color: 'black', type: 'rook' };
  const blackKnight: Piece = { color: 'black', type: 'knight' };
  const blackBishop: Piece = { color: 'black', type: 'bishop' };
  const blackQueen: Piece = { color: 'black', type: 'queen' };
  const blackKing: Piece = { color: 'black', type: 'king' };

  board = placePiece(board, { row: 7, col: 0 }, BOARD_SIZE, blackRook);
  board = placePiece(board, { row: 7, col: 1 }, BOARD_SIZE, blackKnight);
  board = placePiece(board, { row: 7, col: 2 }, BOARD_SIZE, blackBishop);
  board = placePiece(board, { row: 7, col: 3 }, BOARD_SIZE, blackQueen);
  board = placePiece(board, { row: 7, col: 4 }, BOARD_SIZE, blackKing);
  board = placePiece(board, { row: 7, col: 5 }, BOARD_SIZE, blackBishop);
  board = placePiece(board, { row: 7, col: 6 }, BOARD_SIZE, blackKnight);
  board = placePiece(board, { row: 7, col: 7 }, BOARD_SIZE, blackRook);

  for (let i = 0; i < BOARD_SIZE; i++) {
    board = placePiece(board, { row: 6, col: i }, BOARD_SIZE, blackPawn);
  }

  return {
    activeColor: 'white',
    board,
    history: [],
    castlingRights: {
      whiteKingSide: true,
      whiteQueenSide: true,
      blackKingSide: true,
      blackQueenSide: true,
    },
    enPassantTarget: null,
    positionHistory: [],
    halfmoveClock: 0,
  };
}

// Applies a selected move without checking ordinary movement rules or king safety.
// Castling requires a castle marker; promotion moves require a promotion choice.
export function updateGame(game: GameState, move: Move): GameState {
  validateMoveSquare(move.from);
  validateMoveSquare(move.to);

  let piece = getPieceAt(game.board, move.from, BOARD_SIZE);
  if (!piece) {
    throw new Error('No piece at the source square');
  }
  if (piece.color !== game.activeColor) {
    throw new Error('It is not the active player\'s turn');
  }

  const isPawnMove = piece.type === 'pawn';
  const targetPiece = getPieceAt(game.board, move.to, BOARD_SIZE);
  if (targetPiece && targetPiece.color === piece.color) {
    throw new Error('Cannot capture a piece of the same color');
  }

  let enPassantCaptureSquare: Square | null = null;
  if (piece.type === 'pawn' && !targetPiece && game.enPassantTarget
    && move.to.row === game.enPassantTarget.row
    && move.to.col === game.enPassantTarget.col
    && move.from.col !== move.to.col) {
    const direction = piece.color === 'white' ? 1 : -1;
    const capturedPawnSquare = { row: move.from.row, col: move.to.col };
    const capturedPawn = getPieceAt(game.board, capturedPawnSquare, BOARD_SIZE);
    if (move.to.row !== move.from.row + direction
      || Math.abs(move.to.col - move.from.col) !== 1
      || capturedPawn?.type !== 'pawn'
      || capturedPawn.color === piece.color) {
      throw new Error('Invalid en passant capture');
    }
    enPassantCaptureSquare = capturedPawnSquare;
  }

  const startingPawnRow = piece.color === 'white' ? 1 : BOARD_SIZE - 2;
  const enPassantTarget = piece.type === 'pawn'
    && move.from.row === startingPawnRow
    && move.to.col === move.from.col
    && Math.abs(move.to.row - move.from.row) === 2
    ? { row: (move.from.row + move.to.row) / 2, col: move.from.col }
    : null;

  let nextCastlingRights = game.castlingRights;
  if (move.castle !== undefined) {
    if (move.castle !== 'kingSide' && move.castle !== 'queenSide') {
      throw new Error('Invalid castle side');
    }
    if (piece.type !== 'king') {
      throw new Error('Only a king can castle');
    }

    const homeRow = piece.color === 'white' ? 0 : BOARD_SIZE - 1;
    const expectedDestinationCol = move.castle === 'kingSide' ? 6 : 2;
    const rookCol = move.castle === 'kingSide' ? BOARD_SIZE - 1 : 0;
    const rightKey = castlingRightKey(piece.color, move.castle);
    const rookSquare = { row: homeRow, col: rookCol };
    const rook = getPieceAt(game.board, rookSquare, BOARD_SIZE);

    if (move.from.row !== homeRow || move.from.col !== 4
      || move.to.row !== homeRow || move.to.col !== expectedDestinationCol
      || !game.castlingRights[rightKey]) {
      throw new Error('Castling is not available');
    }
    if (rook?.type !== 'rook' || rook.color !== piece.color) {
      throw new Error('Castling rook is not in its starting square');
    }

    const pathCols = move.castle === 'kingSide' ? [5, 6] : [1, 2, 3];
    if (pathCols.some(col => getPieceAt(game.board, { row: homeRow, col }, BOARD_SIZE))) {
      throw new Error('Castling path must be clear');
    }

    nextCastlingRights = revokeKingCastlingRights(nextCastlingRights, piece.color);
  } else if (piece.type === 'king'
    && move.from.col === 4
    && move.from.row === (piece.color === 'white' ? 0 : BOARD_SIZE - 1)
    && move.to.row === move.from.row
    && (move.to.col === 2 || move.to.col === 6)) {
    throw new Error('Castling move must specify castle side');
  }

  const promotion = move.promotion;
  if (promotion !== undefined && promotion !== 'queen' && promotion !== 'rook'
    && promotion !== 'bishop' && promotion !== 'knight') {
    throw new Error('Invalid promotion piece');
  }

  if (piece.type === 'pawn') {
    const promotionRow = piece.color === 'white' ? BOARD_SIZE - 1 : 0;
    if (move.to.row === promotionRow) {
      if (promotion === undefined) {
        throw new Error('Promotion piece must be specified');
      }
      piece = { ...piece, type: promotion };
    } else if (promotion !== undefined) {
      throw new Error('Promotion can only occur on the last rank for the pawn color');
    }
  } else if (promotion !== undefined) {
    throw new Error('Only pawns can be promoted');
  }

  if (piece.type === 'king' && move.castle === undefined) {
    nextCastlingRights = revokeKingCastlingRights(nextCastlingRights, piece.color);
  } else if (piece.type === 'rook') {
    nextCastlingRights = revokeRookCastlingRight(nextCastlingRights, piece.color, move.from);
  }

  if (targetPiece?.type === 'rook') {
    nextCastlingRights = revokeRookCastlingRight(nextCastlingRights, targetPiece.color, move.to);
  }

  const boardWithPiece = placePiece(game.board, move.to, BOARD_SIZE, piece);
  let nextBoard = removePiece(boardWithPiece, move.from, BOARD_SIZE);
  if (enPassantCaptureSquare) {
    nextBoard = removePiece(nextBoard, enPassantCaptureSquare, BOARD_SIZE);
  }
  if (move.castle !== undefined) {
    const homeRow = piece.color === 'white' ? 0 : BOARD_SIZE - 1;
    const rookFrom = { row: homeRow, col: move.castle === 'kingSide' ? 7 : 0 };
    const rookTo = { row: homeRow, col: move.castle === 'kingSide' ? 5 : 3 };
    const rook = getPieceAt(game.board, rookFrom, BOARD_SIZE);
    if (!rook) {
      throw new Error('Castling rook is not in its starting square');
    }
    nextBoard = removePiece(nextBoard, rookFrom, BOARD_SIZE);
    nextBoard = placePiece(nextBoard, rookTo, BOARD_SIZE, rook);
  }

  return {
    board: nextBoard,
    activeColor: piece.color === 'white' ? 'black' : 'white',
    history: [...game.history, move],
    castlingRights: nextCastlingRights,
    enPassantTarget,
    positionHistory: [...game.positionHistory, {
      board: game.board,
      activeColor: game.activeColor,
      castlingRights: game.castlingRights,
      enPassantTarget: game.enPassantTarget,
    }],
    halfmoveClock: isPawnMove || targetPiece || enPassantCaptureSquare ? 0 : game.halfmoveClock + 1,
  }
}
