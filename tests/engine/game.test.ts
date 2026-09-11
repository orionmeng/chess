import { describe, expect, it } from 'vitest';
import { getPieceAt } from '../../src/engine/pieces';
import { createInitialGame } from '../../src/engine/game';

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
