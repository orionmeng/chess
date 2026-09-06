import { describe, expect, it } from 'vitest';
import { createEmptyBoard } from '../../src/engine/board';
import { getPieceAt, placePiece } from '../../src/engine/pieces';

const BOARD_SIZE = 8;
const queen = { color: 'white' as const, type: 'queen' as const };

describe('getPieceAt', () => {
	it('returns null for an empty square', () => {
		const board = createEmptyBoard();
		expect(getPieceAt(board, { row: 6, col: 7 }, BOARD_SIZE)).toBeNull();
	});
	it('returns the piece at an occupied square', () => {
		const board = placePiece(createEmptyBoard(), { row: 6, col: 7 }, BOARD_SIZE, queen);
		expect(getPieceAt(board, { row: 6, col: 7 }, BOARD_SIZE)).toEqual(queen);
	});
	it('returns null for a square outside the board', () => {
		const board = createEmptyBoard();
		expect(getPieceAt(board, { row: 5, col: BOARD_SIZE }, BOARD_SIZE)).toBeNull();
	});
});

describe('placePiece', () => {
	it('places a piece on the requested square', () => {
		const board = createEmptyBoard();
		const nextBoard = placePiece(board, { row: 3, col: 4 }, BOARD_SIZE, queen);
		expect(getPieceAt(nextBoard, { row: 3, col: 4 }, BOARD_SIZE)).toEqual(queen);
	});
	it('does not change the original board', () => {
		const board = createEmptyBoard();
		placePiece(board, { row: 2, col: 3 }, BOARD_SIZE, queen);
		expect(getPieceAt(board, { row: 2, col: 3 }, BOARD_SIZE)).toBeNull();
	});
	it('throws for a square outside the board', () => {
		const board = createEmptyBoard();
		expect(() => placePiece(board, { row: 5, col: BOARD_SIZE }, BOARD_SIZE, queen)).toThrow();
	});
});
