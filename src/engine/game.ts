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
import type { GameState, Piece, Move, Square } from './types';

const BOARD_SIZE = 8;

function validateMoveSquare(square: Square): void {
  if (!Number.isInteger(square.row) || !Number.isInteger(square.col)) {
    throw new Error('Square coordinates must be integers.');
  }
  if (!isOnBoard(square)) {
    throw new Error('Square is outside the board.');
  }
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
  };
}

// Applies a selected move without checking its movement rules or king safety.
// A pawn reaching its promotion rank requires a promotion choice on the move.
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

  const targetPiece = getPieceAt(game.board, move.to, BOARD_SIZE);
  if (targetPiece && targetPiece.color === piece.color) {
    throw new Error('Cannot capture a piece of the same color');
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

  const boardWithPiece = placePiece(game.board, move.to, BOARD_SIZE, piece);
  const nextBoard = removePiece(boardWithPiece, move.from, BOARD_SIZE);

  return {
    board: nextBoard,
    activeColor: piece.color === 'white' ? 'black' : 'white',
    history: [...game.history, move]
  }
}
