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

import { createEmptyBoard } from './board';
import { placePiece } from './pieces';
import type { GameState, Piece } from './types';

const BOARD_SIZE = 8;

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
