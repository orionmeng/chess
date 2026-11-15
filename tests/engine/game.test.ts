import { describe, expect, it } from 'vitest';
import { createEmptyBoard } from '../../src/engine/board';
import { getPieceAt, placePiece } from '../../src/engine/pieces';
import { createInitialGame, updateGame } from '../../src/engine/game';
import type { Color, PromotionPieceType } from '../../src/engine/types';

const BOARD_SIZE = 8;
const NO_CASTLING_RIGHTS = {
	whiteKingSide: false,
	whiteQueenSide: false,
	blackKingSide: false,
	blackQueenSide: false,
};

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
			const game = { activeColor: 'white' as const, board, history: [], castlingRights: NO_CASTLING_RIGHTS };

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

		it.each([
			['source', { row: 1, col: 4.5 }, { row: 2, col: 4 }, 'Square coordinates must be integers.'],
			['source', { row: NaN, col: 4 }, { row: 2, col: 4 }, 'Square coordinates must be integers.'],
			['source', { row: 8, col: 4 }, { row: 2, col: 4 }, 'Square is outside the board.'],
			['source', { row: 1, col: -1 }, { row: 2, col: 4 }, 'Square is outside the board.'],
			['destination', { row: 1, col: 4 }, { row: 2, col: 4.5 }, 'Square coordinates must be integers.'],
			['destination', { row: 1, col: 4 }, { row: 2, col: Infinity }, 'Square coordinates must be integers.'],
			['destination', { row: 1, col: 4 }, { row: 8, col: 4 }, 'Square is outside the board.'],
			['destination', { row: 1, col: 4 }, { row: 2, col: -1 }, 'Square is outside the board.'],
		] as const)(
			'rejects invalid %s coordinates without changing the game',
			(_part, from, to, error) => {
				const game = createInitialGame();
				const originalBoard = [...game.board];
				const originalHistory = [...game.history];

				expect(() => updateGame(game, { from, to })).toThrow(error);
				expect(game.board).toEqual(originalBoard);
				expect(game.activeColor).toBe('white');
				expect(game.history).toEqual(originalHistory);
			},
		);

		it.each([
			['white', 'queen'], ['white', 'rook'], ['white', 'bishop'], ['white', 'knight'],
			['black', 'queen'], ['black', 'rook'], ['black', 'bishop'], ['black', 'knight'],
		] satisfies Array<[Color, PromotionPieceType]>)(
			'promotes a %s pawn to a %s and records the choice',
			(color, promotion) => {
				const from = { row: color === 'white' ? 6 : 1, col: 3 };
				const to = { row: color === 'white' ? 7 : 0, col: 3 };
				const pawn = { color, type: 'pawn' as const };
				const board = placePiece(createEmptyBoard(), from, BOARD_SIZE, pawn);
				const game = { activeColor: color, board, history: [], castlingRights: NO_CASTLING_RIGHTS };
				const move = { from, to, promotion };

				const nextGame = updateGame(game, move);

				expect(getPieceAt(nextGame.board, from, BOARD_SIZE)).toBeNull();
				expect(getPieceAt(nextGame.board, to, BOARD_SIZE)).toEqual({ color, type: promotion });
				expect(nextGame.activeColor).toBe(color === 'white' ? 'black' : 'white');
				expect(nextGame.history).toEqual([move]);
				expect(getPieceAt(game.board, from, BOARD_SIZE)).toEqual(pawn);
				expect(getPieceAt(game.board, to, BOARD_SIZE)).toBeNull();
				expect(game.history).toEqual([]);
			},
		);

		it.each(['white', 'black'] as const)('promotes a %s pawn when capturing on the last rank', (color) => {
			const from = { row: color === 'white' ? 6 : 1, col: 3 };
			const to = { row: color === 'white' ? 7 : 0, col: 4 };
			let board = placePiece(createEmptyBoard(), from, BOARD_SIZE, { color, type: 'pawn' });
			board = placePiece(board, to, BOARD_SIZE, {
				color: color === 'white' ? 'black' : 'white', type: 'rook',
			});
			const game = { activeColor: color, board, history: [], castlingRights: NO_CASTLING_RIGHTS };

			const nextGame = updateGame(game, { from, to, promotion: 'knight' });

			expect(getPieceAt(nextGame.board, from, BOARD_SIZE)).toBeNull();
			expect(getPieceAt(nextGame.board, to, BOARD_SIZE)).toEqual({ color, type: 'knight' });
			expect(getPieceAt(game.board, to, BOARD_SIZE)?.type).toBe('rook');
		});

		it.each(['white', 'black'] as const)('requires a promotion choice for a %s pawn on its final rank', (color) => {
			const from = { row: color === 'white' ? 6 : 1, col: 3 };
			const to = { row: color === 'white' ? 7 : 0, col: 3 };
			const board = placePiece(createEmptyBoard(), from, BOARD_SIZE, { color, type: 'pawn' });
			const game = { activeColor: color, board, history: [], castlingRights: NO_CASTLING_RIGHTS };

			expect(() => updateGame(game, { from, to })).toThrow('Promotion piece must be specified');
			expect(getPieceAt(game.board, from, BOARD_SIZE)).toEqual({ color, type: 'pawn' });
		});

		it.each([
			['white', 5, 6], ['white', 1, 0],
			['black', 2, 1], ['black', 6, 7],
		] satisfies Array<[Color, number, number]>)(
			'rejects a %s pawn promotion on row %i to row %i',
			(color, fromRow, toRow) => {
				const from = { row: fromRow, col: 3 };
				const to = { row: toRow, col: 3 };
				const board = placePiece(createEmptyBoard(), from, BOARD_SIZE, { color, type: 'pawn' });
				const game = { activeColor: color, board, history: [], castlingRights: NO_CASTLING_RIGHTS };

				expect(() => updateGame(game, { from, to, promotion: 'queen' }))
					.toThrow('Promotion can only occur on the last rank for the pawn color');
			},
		);

		it('rejects a promotion choice for a non-pawn', () => {
			const from = { row: 3, col: 3 };
			const board = placePiece(createEmptyBoard(), from, BOARD_SIZE, { color: 'white', type: 'rook' });
			const game = { activeColor: 'white' as const, board, history: [], castlingRights: NO_CASTLING_RIGHTS };

			expect(() => updateGame(game, { from, to: { row: 3, col: 4 }, promotion: 'queen' }))
				.toThrow('Only pawns can be promoted');
		});

		it.each([
			['white', 'kingSide'], ['white', 'queenSide'],
			['black', 'kingSide'], ['black', 'queenSide'],
		] as const)('moves the %s rook when the king castles %s', (color, castle) => {
			const homeRow = color === 'white' ? 0 : 7;
			const kingFrom = { row: homeRow, col: 4 };
			const rookFrom = { row: homeRow, col: castle === 'kingSide' ? 7 : 0 };
			const kingTo = { row: homeRow, col: castle === 'kingSide' ? 6 : 2 };
			const rookTo = { row: homeRow, col: castle === 'kingSide' ? 5 : 3 };
			let board = placePiece(createEmptyBoard(), kingFrom, BOARD_SIZE, { color, type: 'king' });
			board = placePiece(board, rookFrom, BOARD_SIZE, { color, type: 'rook' });
			const rights = {
				whiteKingSide: true,
				whiteQueenSide: true,
				blackKingSide: true,
				blackQueenSide: true,
			};
			const game = { activeColor: color, board, history: [], castlingRights: rights };
			const move = { from: kingFrom, to: kingTo, castle };

			const nextGame = updateGame(game, move);

			expect(getPieceAt(nextGame.board, kingFrom, BOARD_SIZE)).toBeNull();
			expect(getPieceAt(nextGame.board, rookFrom, BOARD_SIZE)).toBeNull();
			expect(getPieceAt(nextGame.board, kingTo, BOARD_SIZE)).toEqual({ color, type: 'king' });
			expect(getPieceAt(nextGame.board, rookTo, BOARD_SIZE)).toEqual({ color, type: 'rook' });
			expect(nextGame.history).toEqual([move]);
			expect(nextGame.castlingRights[`${color}KingSide` as 'whiteKingSide' | 'blackKingSide']).toBe(false);
			expect(nextGame.castlingRights[`${color}QueenSide` as 'whiteQueenSide' | 'blackQueenSide']).toBe(false);
			expect(nextGame.castlingRights[`${color === 'white' ? 'black' : 'white'}KingSide` as 'whiteKingSide' | 'blackKingSide']).toBe(true);
			expect(game.castlingRights.whiteKingSide).toBe(true);
			expect(game.board[kingFrom.row * BOARD_SIZE + kingFrom.col]).toEqual({ color, type: 'king' });
		});

		it('revokes both castling rights when a king moves normally', () => {
			const from = { row: 0, col: 4 };
			let board = placePiece(createEmptyBoard(), from, BOARD_SIZE, { color: 'white', type: 'king' });
			const game = {
				activeColor: 'white' as const,
				board,
				history: [],
				castlingRights: {
					whiteKingSide: true, whiteQueenSide: true,
					blackKingSide: true, blackQueenSide: true,
				},
			};

			const nextGame = updateGame(game, { from, to: { row: 1, col: 4 } });

			expect(nextGame.castlingRights.whiteKingSide).toBe(false);
			expect(nextGame.castlingRights.whiteQueenSide).toBe(false);
			expect(nextGame.castlingRights.blackKingSide).toBe(true);
			expect(nextGame.castlingRights.blackQueenSide).toBe(true);
			expect(game.castlingRights.whiteKingSide).toBe(true);
		});

		it.each([
			['white', 0, 0, 'whiteQueenSide'],
			['white', 0, 7, 'whiteKingSide'],
			['black', 7, 0, 'blackQueenSide'],
			['black', 7, 7, 'blackKingSide'],
		] as const)('revokes %s rook castling rights when that corner rook moves', (color, row, col, right) => {
			const from = { row, col };
			const board = placePiece(createEmptyBoard(), from, BOARD_SIZE, { color, type: 'rook' });
			const rights = {
				whiteKingSide: true,
				whiteQueenSide: true,
				blackKingSide: true,
				blackQueenSide: true,
			};
			const game = { activeColor: color, board, history: [], castlingRights: rights };

			const nextGame = updateGame(game, { from, to: { row: row === 0 ? 1 : 6, col } });

			expect(nextGame.castlingRights[right]).toBe(false);
			expect(game.castlingRights[right]).toBe(true);
		});

		it('revokes castling rights when a rook is captured on its starting square', () => {
			const from = { row: 3, col: 7 };
			const to = { row: 7, col: 7 };
			let board = placePiece(createEmptyBoard(), from, BOARD_SIZE, { color: 'white', type: 'rook' });
			board = placePiece(board, to, BOARD_SIZE, { color: 'black', type: 'rook' });
			const game = {
				activeColor: 'white' as const,
				board,
				history: [],
				castlingRights: {
					whiteKingSide: true, whiteQueenSide: true,
					blackKingSide: true, blackQueenSide: true,
				},
			};

			const nextGame = updateGame(game, { from, to });

			expect(nextGame.castlingRights.blackKingSide).toBe(false);
			expect(nextGame.castlingRights.blackQueenSide).toBe(true);
			expect(game.castlingRights.blackKingSide).toBe(true);
		});

		it('rejects an invalid promotion choice at runtime', () => {
			const from = { row: 6, col: 3 };
			const board = placePiece(createEmptyBoard(), from, BOARD_SIZE, { color: 'white', type: 'pawn' });
			const game = { activeColor: 'white' as const, board, history: [], castlingRights: NO_CASTLING_RIGHTS };
			const move = { from, to: { row: 7, col: 3 }, promotion: 'king' as const };

			// @ts-expect-error Invalid runtime input must still be rejected.
			expect(() => updateGame(game, move)).toThrow('Invalid promotion piece');
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

	it('starts with all castling rights available', () => {
		const game = createInitialGame();

		expect(game.castlingRights).toEqual({
			whiteKingSide: true,
			whiteQueenSide: true,
			blackKingSide: true,
			blackQueenSide: true,
		});
	});
});
