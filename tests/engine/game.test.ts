import { describe, expect, it } from 'vitest';
import { createEmptyBoard } from '../../src/engine/board';
import { getPieceAt, placePiece } from '../../src/engine/pieces';
import { createInitialGame, updateGame } from '../../src/engine/game';

const BOARD_SIZE = 8;

function countPiecesByColor(
	board: ReturnType<typeof createInitialGame>['board'],
	color: 'white' | 'black',
): number {
	return board.filter((piece) => piece?.color === color).length;
}

describe('createInitialGame', () => {
	it('creates a board with 64 squares', () => {
		const game = createInitialGame();

		expect(game.board).toHaveLength(64);
	});

	describe('updateGame', () => {
		it('moves a piece to an empty square and switches turns', () => {
			const game = createInitialGame();
			const move = { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } };

			const nextGame = updateGame(game, move);

			expect(getPieceAt(nextGame.board, move.from, BOARD_SIZE)).toBeNull();
			expect(getPieceAt(nextGame.board, move.to, BOARD_SIZE)).toEqual({
				color: 'white',
				type: 'pawn',
			});
			expect(nextGame.activeColor).toBe('black');
			expect(nextGame.history).toEqual([move]);
			expect(getPieceAt(nextGame.board, { row: 1, col: 3 }, BOARD_SIZE)).toEqual({
				color: 'white',
				type: 'pawn',
			});
		});

		it('replaces an opposing piece when capturing', () => {
			const whitePawn = { color: 'white' as const, type: 'pawn' as const };
			const blackPawn = { color: 'black' as const, type: 'pawn' as const };
			const from = { row: 3, col: 3 };
			const to = { row: 4, col: 4 };
			let board = placePiece(createEmptyBoard(), from, BOARD_SIZE, whitePawn);
			board = placePiece(board, to, BOARD_SIZE, blackPawn);
			const game = { activeColor: 'white' as const, board, history: [] };

			const nextGame = updateGame(game, { from, to });

			expect(getPieceAt(nextGame.board, from, BOARD_SIZE)).toBeNull();
			expect(getPieceAt(nextGame.board, to, BOARD_SIZE)).toEqual(whitePawn);
			expect(getPieceAt(game.board, to, BOARD_SIZE)).toEqual(blackPawn);
		});

		it('preserves earlier history and switches back to white after a black move', () => {
			const whiteMove = { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } };
			const blackMove = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } };
			const afterWhite = updateGame(createInitialGame(), whiteMove);

			const afterBlack = updateGame(afterWhite, blackMove);

			expect(afterBlack.activeColor).toBe('white');
			expect(afterBlack.history).toEqual([whiteMove, blackMove]);
			expect(afterWhite.history).toEqual([whiteMove]);
			expect(getPieceAt(afterBlack.board, blackMove.from, BOARD_SIZE)).toBeNull();
			expect(getPieceAt(afterBlack.board, blackMove.to, BOARD_SIZE)).toEqual({
				color: 'black',
				type: 'pawn',
			});
		});

		it('returns a new state without changing the original game', () => {
			const game = createInitialGame();
			const originalBoard = [...game.board];
			const move = { from: { row: 1, col: 4 }, to: { row: 2, col: 4 } };

			const nextGame = updateGame(game, move);

			expect(nextGame).not.toBe(game);
			expect(nextGame.board).not.toBe(game.board);
			expect(nextGame.history).not.toBe(game.history);
			expect(game.board).toEqual(originalBoard);
			expect(game.activeColor).toBe('white');
			expect(game.history).toEqual([]);
		});

		it('rejects a move from an empty square', () => {
			const game = createInitialGame();
			const move = { from: { row: 3, col: 4 }, to: { row: 4, col: 4 } };

			expect(() => updateGame(game, move)).toThrow('No piece at the source square');
		});

		it('rejects a move by a piece whose color is not active', () => {
			const game = createInitialGame();
			const move = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } };

			expect(() => updateGame(game, move)).toThrow("It is not the active player's turn");
		});

		it('rejects a move onto a friendly piece', () => {
			const game = createInitialGame();
			const move = { from: { row: 0, col: 0 }, to: { row: 1, col: 0 } };

			expect(() => updateGame(game, move)).toThrow('Cannot capture a piece of the same color');
		});

		it('rejects an off-board destination without modifying the game', () => {
			const game = createInitialGame();
			const originalBoard = [...game.board];
			const move = { from: { row: 1, col: 0 }, to: { row: 8, col: 0 } };

			expect(() => updateGame(game, move)).toThrow('Square is outside the board.');
			expect(game.board).toEqual(originalBoard);
			expect(game.activeColor).toBe('white');
			expect(game.history).toEqual([]);
		});
	});

	it('places 16 pieces for each color', () => {
		const game = createInitialGame();

		expect(countPiecesByColor(game.board, 'white')).toBe(16);
		expect(countPiecesByColor(game.board, 'black')).toBe(16);
	});

	it('places the white back rank in the expected order', () => {
		const game = createInitialGame();
		const expectedPieces = [
			'rook',
			'knight',
			'bishop',
			'queen',
			'king',
			'bishop',
			'knight',
			'rook',
		];

		const actualPieces = expectedPieces.map((_, col) =>
			getPieceAt(game.board, { row: 0, col }, BOARD_SIZE),
		);

		expect(actualPieces.map((piece) => piece?.type)).toEqual(expectedPieces);
		expect(actualPieces.every((piece) => piece?.color === 'white')).toBe(true);
	});

	it('places pawns on the second and seventh rows', () => {
		const game = createInitialGame();

		for (let col = 0; col < BOARD_SIZE; col++) {
			expect(getPieceAt(game.board, { row: 1, col }, BOARD_SIZE)).toEqual({
				color: 'white',
				type: 'pawn',
			});
			expect(getPieceAt(game.board, { row: 6, col }, BOARD_SIZE)).toEqual({
				color: 'black',
				type: 'pawn',
			});
		}
	});

	it('starts with white to move and no move history', () => {
		const game = createInitialGame();

		expect(game.activeColor).toBe('white');
		expect(game.history).toEqual([]);
	});
});
