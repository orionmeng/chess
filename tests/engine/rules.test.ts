import { describe, expect, it } from 'vitest';
import { createEmptyBoard } from '../../src/engine/board';
import { placePiece } from '../../src/engine/pieces';
import { getLegalMoves, isInCheck, isSquareAttacked } from '../../src/engine/rules';
import type { Color, GameState, Piece, Square } from '../../src/engine/types';

const BOARD_SIZE = 8;

function createGame(entries: Array<[Square, Piece]>, activeColor: Color = 'white'): GameState {
  let board = createEmptyBoard();
  for (const [square, piece] of entries) {
    board = placePiece(board, square, BOARD_SIZE, piece);
  }
  return { activeColor, board, history: [] };
}

function expectMoves(actual: Square[], expected: Square[]): void {
  const sortSquares = (squares: Square[]) =>
    [...squares].sort((a, b) => a.row - b.row || a.col - b.col);

  expect(sortSquares(actual)).toEqual(sortSquares(expected));
}

describe('isSquareAttacked', () => {
  it.each([
    ['rook', -1, 0], ['rook', 1, 0], ['rook', 0, -1], ['rook', 0, 1],
    ['bishop', -1, -1], ['bishop', -1, 1], ['bishop', 1, -1], ['bishop', 1, 1],
    ['queen', -1, 0], ['queen', 1, 0], ['queen', 0, -1], ['queen', 0, 1],
    ['queen', -1, -1], ['queen', -1, 1], ['queen', 1, -1], ['queen', 1, 1],
  ] as const)('checks a %s ray in direction (%i, %i)', (type, rowStep, colStep) => {
    const from = { row: 3, col: 3 };
    const blocker = { row: 3 + rowStep, col: 3 + colStep };
    const target = { row: 3 + 2 * rowStep, col: 3 + 2 * colStep };
    const attacker: [Square, Piece] = [from, { type, color: 'white' }];
    const open = createGame([attacker]);
    const blocked = createGame([
      attacker,
      [blocker, { type: 'pawn', color: 'black' }],
    ]);

    expect(isSquareAttacked(open, target, 'white')).toBe(true);
    expect(isSquareAttacked(blocked, blocker, 'white')).toBe(true);
    expect(isSquareAttacked(blocked, target, 'white')).toBe(false);
  });

  it.each([
    ['pawn', { row: 3, col: 3 }, { row: 4, col: 4 }],
    ['knight', { row: 3, col: 3 }, { row: 5, col: 4 }],
    ['king', { row: 3, col: 3 }, { row: 4, col: 4 }],
    ['rook', { row: 3, col: 3 }, { row: 3, col: 6 }],
    ['bishop', { row: 3, col: 3 }, { row: 6, col: 6 }],
    ['queen', { row: 3, col: 3 }, { row: 6, col: 6 }],
  ] as const)('counts a %s defending a friendly-occupied square', (type, from, target) => {
    const game = createGame([
      [from, { type, color: 'white' }],
      [target, { type: 'pawn', color: 'white' }],
    ]);

    expect(isSquareAttacked(game, target, 'white')).toBe(true);
    expect(isSquareAttacked(game, from, 'white')).toBe(false);
  });

  it.each([
    ['rook', { row: 3, col: 6 }, { row: 3, col: 5 }],
    ['bishop', { row: 6, col: 6 }, { row: 5, col: 5 }],
    ['queen', { row: 6, col: 6 }, { row: 5, col: 5 }],
    ['queen', { row: 3, col: 6 }, { row: 3, col: 5 }],
  ] as const)('stops a %s attack at an intervening piece', (type, target, blocker) => {
    const game = createGame([
      [{ row: 3, col: 3 }, { type, color: 'white' }],
      [blocker, { type: 'pawn', color: 'black' }],
      [target, { type: 'knight', color: 'white' }],
    ]);

    expect(isSquareAttacked(game, blocker, 'white')).toBe(true);
    expect(isSquareAttacked(game, target, 'white')).toBe(false);
  });

  it('distinguishes pawn attacks from forward moves for both colors', () => {
    const game = createGame([
      [{ row: 1, col: 2 }, { type: 'pawn', color: 'white' }],
      [{ row: 6, col: 5 }, { type: 'pawn', color: 'black' }],
    ]);

    expect(isSquareAttacked(game, { row: 2, col: 1 }, 'white')).toBe(true);
    expect(isSquareAttacked(game, { row: 2, col: 2 }, 'white')).toBe(false);
    expect(isSquareAttacked(game, { row: 3, col: 2 }, 'white')).toBe(false);
    expect(isSquareAttacked(game, { row: 5, col: 6 }, 'black')).toBe(true);
    expect(isSquareAttacked(game, { row: 5, col: 5 }, 'black')).toBe(false);
  });

  it('counts attacks by a pinned piece', () => {
    const game = createGame([
      [{ row: 0, col: 0 }, { type: 'king', color: 'white' }],
      [{ row: 0, col: 1 }, { type: 'knight', color: 'white' }],
      [{ row: 0, col: 7 }, { type: 'rook', color: 'black' }],
    ]);

    expect(isSquareAttacked(game, { row: 2, col: 2 }, 'white')).toBe(true);
  });

  it('finds another attacker when an earlier sliding attacker is blocked', () => {
    const game = createGame([
      [{ row: 0, col: 0 }, { type: 'rook', color: 'black' }],
      [{ row: 0, col: 2 }, { type: 'pawn', color: 'white' }],
      [{ row: 2, col: 3 }, { type: 'knight', color: 'black' }],
    ]);

    expect(isSquareAttacked(game, { row: 0, col: 4 }, 'black')).toBe(true);
  });

  it('rejects a target outside the board', () => {
    expect(() => isSquareAttacked(createGame([]), { row: 8, col: 0 }, 'white'))
      .toThrow('Square is outside the board.');
  });

  it.each([
    { row: 3, col: 3.5 },
    { row: 3.5, col: 3 },
    { row: 3.5, col: 3.5 },
    { row: NaN, col: 3 },
    { row: 3, col: Infinity },
  ])('rejects non-integer target coordinates: $row, $col', (target) => {
    const game = createGame([
      [{ row: 3, col: 3 }, { type: 'rook', color: 'white' }],
    ]);

    expect(() => isSquareAttacked(game, target, 'white'))
      .toThrow('Square coordinates must be integers.');
  });
});

describe('getLegalMoves', () => {
  const rookMoves: Square[] = [
    { row: 0, col: 3 }, { row: 1, col: 3 }, { row: 2, col: 3 },
    { row: 4, col: 3 }, { row: 5, col: 3 }, { row: 6, col: 3 }, { row: 7, col: 3 },
    { row: 3, col: 0 }, { row: 3, col: 1 }, { row: 3, col: 2 },
    { row: 3, col: 4 }, { row: 3, col: 5 }, { row: 3, col: 6 }, { row: 3, col: 7 },
  ];
  const bishopMoves: Square[] = [
    { row: 2, col: 2 }, { row: 1, col: 1 }, { row: 0, col: 0 },
    { row: 2, col: 4 }, { row: 1, col: 5 }, { row: 0, col: 6 },
    { row: 4, col: 2 }, { row: 5, col: 1 }, { row: 6, col: 0 },
    { row: 4, col: 4 }, { row: 5, col: 5 }, { row: 6, col: 6 }, { row: 7, col: 7 },
  ];
  const knightMoves: Square[] = [
    { row: 1, col: 2 }, { row: 1, col: 4 }, { row: 2, col: 1 }, { row: 2, col: 5 },
    { row: 4, col: 1 }, { row: 4, col: 5 }, { row: 5, col: 2 }, { row: 5, col: 4 },
  ];
  const kingMoves: Square[] = [
    { row: 2, col: 2 }, { row: 2, col: 3 }, { row: 2, col: 4 },
    { row: 3, col: 2 }, { row: 3, col: 4 },
    { row: 4, col: 2 }, { row: 4, col: 3 }, { row: 4, col: 4 },
  ];

  it.each([
    ['white', 'pawn', [{ row: 4, col: 3 }]],
    ['black', 'pawn', [{ row: 2, col: 3 }]],
    ['white', 'rook', rookMoves], ['black', 'rook', rookMoves],
    ['white', 'bishop', bishopMoves], ['black', 'bishop', bishopMoves],
    ['white', 'knight', knightMoves], ['black', 'knight', knightMoves],
    ['white', 'queen', [...rookMoves, ...bishopMoves]],
    ['black', 'queen', [...rookMoves, ...bishopMoves]],
    ['white', 'king', kingMoves], ['black', 'king', kingMoves],
  ] satisfies Array<[Color, Piece['type'], Square[]]>)(
    'returns the expected basic moves for a %s %s',
    (color, type, expected) => {
      const from = { row: 3, col: 3 };
      const otherColor = color === 'white' ? 'black' : 'white';
      const entries: Array<[Square, Piece]> = [
        [from, { type, color }],
        [{ row: 7, col: 0 }, { type: 'king', color: otherColor }],
      ];
      if (type !== 'king') {
        entries.push([{ row: 0, col: 7 }, { type: 'king', color }]);
      }

      expectMoves(getLegalMoves(createGame(entries, color), from), expected);
    },
  );

  it('allows blocking a sliding attack to escape check', () => {
    const from = { row: 2, col: 3 };
    const game = createGame([
      [{ row: 0, col: 0 }, { type: 'king', color: 'white' }],
      [from, { type: 'bishop', color: 'white' }],
      [{ row: 0, col: 7 }, { type: 'rook', color: 'black' }],
      [{ row: 7, col: 5 }, { type: 'king', color: 'black' }],
    ]);

    expect(isInCheck(game, 'white')).toBe(true);
    expectMoves(getLegalMoves(game, from), [{ row: 0, col: 1 }, { row: 0, col: 5 }]);
  });

  it('allows capturing the attacking piece to escape check', () => {
    const from = { row: 1, col: 7 };
    const game = createGame([
      [{ row: 0, col: 0 }, { type: 'king', color: 'white' }],
      [from, { type: 'rook', color: 'white' }],
      [{ row: 0, col: 7 }, { type: 'rook', color: 'black' }],
      [{ row: 7, col: 5 }, { type: 'king', color: 'black' }],
    ]);

    expect(isInCheck(game, 'white')).toBe(true);
    expectMoves(getLegalMoves(game, from), [{ row: 0, col: 7 }]);
  });

  it('rejects blocking or capturing only one attacker in a double check', () => {
    const from = { row: 1, col: 1 };
    const game = createGame([
      [{ row: 0, col: 0 }, { type: 'king', color: 'white' }],
      [from, { type: 'rook', color: 'white' }],
      [{ row: 0, col: 7 }, { type: 'rook', color: 'black' }],
      [{ row: 2, col: 1 }, { type: 'knight', color: 'black' }],
      [{ row: 7, col: 5 }, { type: 'king', color: 'black' }],
    ]);

    expect(isInCheck(game, 'white')).toBe(true);
    expectMoves(getLegalMoves(game, from), []);
  });

  it('rejects a capture of the opposing king while preserving other moves', () => {
    const from = { row: 3, col: 3 };
    const game = createGame([
      [{ row: 0, col: 0 }, { type: 'king', color: 'white' }],
      [from, { type: 'rook', color: 'white' }],
      [{ row: 3, col: 6 }, { type: 'king', color: 'black' }],
    ]);

    const moves = getLegalMoves(game, from);

    expect(moves).not.toContainEqual({ row: 3, col: 6 });
    expect(moves).toContainEqual({ row: 3, col: 4 });
    expect(moves).not.toContainEqual({ row: 3, col: 7 });
  });

  it('does not silently remove other moves when the opposing king is absent', () => {
    const from = { row: 3, col: 3 };
    const game = createGame([
      [{ row: 0, col: 0 }, { type: 'king', color: 'white' }],
      [from, { type: 'rook', color: 'white' }],
    ]);

    expect(getLegalMoves(game, from)).toContainEqual({ row: 3, col: 4 });
  });

  it('throws when the moving side has no king and a candidate is simulated', () => {
    const from = { row: 3, col: 3 };
    const game = createGame([
      [from, { type: 'rook', color: 'white' }],
      [{ row: 7, col: 0 }, { type: 'king', color: 'black' }],
    ]);

    expect(() => getLegalMoves(game, from)).toThrow('King not found on the board');
  });

  it('returns no moves without checking for a missing king when there are no candidates', () => {
    const from = { row: 7, col: 3 };
    const game = createGame([
      [from, { type: 'pawn', color: 'white' }],
      [{ row: 0, col: 0 }, { type: 'king', color: 'black' }],
    ]);

    expect(getLegalMoves(game, from)).toEqual([]);
  });

  it('rejects moving a pinned piece off its line and leaves the input unchanged', () => {
    const from = { row: 1, col: 0 };
    const game = createGame([
      [{ row: 0, col: 0 }, { type: 'king', color: 'white' }],
      [from, { type: 'rook', color: 'white' }],
      [{ row: 7, col: 0 }, { type: 'rook', color: 'black' }],
      [{ row: 7, col: 7 }, { type: 'king', color: 'black' }],
    ]);
    const boardBefore = [...game.board];

    const moves = getLegalMoves(game, from);

    expect(moves).not.toContainEqual({ row: 1, col: 1 });
    expect(moves).toContainEqual({ row: 7, col: 0 });
    expect(game.board).toEqual(boardBefore);
    expect(game.history).toEqual([]);
    expect(game.activeColor).toBe('white');
  });

  it('does not let a king capture an enemy piece defended by a rook', () => {
    const from = { row: 3, col: 3 };
    const game = createGame([
      [from, { type: 'king', color: 'white' }],
      [{ row: 3, col: 4 }, { type: 'knight', color: 'black' }],
      [{ row: 3, col: 7 }, { type: 'rook', color: 'black' }],
      [{ row: 7, col: 7 }, { type: 'king', color: 'black' }],
    ]);

    expect(getLegalMoves(game, from)).not.toContainEqual({ row: 3, col: 4 });
  });

  it('rejects king moves into an empty square attacked by a pawn', () => {
    const from = { row: 3, col: 3 };
    const game = createGame([
      [from, { type: 'king', color: 'white' }],
      [{ row: 5, col: 5 }, { type: 'pawn', color: 'black' }],
      [{ row: 7, col: 7 }, { type: 'king', color: 'black' }],
    ]);

    expect(getLegalMoves(game, from)).not.toContainEqual({ row: 4, col: 4 });
  });

  it('returns no moves for an inactive piece', () => {
    const from = { row: 7, col: 0 };
    const game = createGame([[from, { type: 'rook', color: 'black' }]]);

    expect(getLegalMoves(game, from)).toEqual([]);
  });
});

describe('isInCheck', () => {
  it('detects an attack on the king and respects blockers', () => {
    const king: [Square, Piece] = [{ row: 0, col: 0 }, { type: 'king', color: 'white' }];
    const rook: [Square, Piece] = [{ row: 0, col: 7 }, { type: 'rook', color: 'black' }];
    const blocker: [Square, Piece] = [{ row: 0, col: 4 }, { type: 'bishop', color: 'white' }];

    expect(isInCheck(createGame([king, rook]), 'white')).toBe(true);
    expect(isInCheck(createGame([king, rook, blocker]), 'white')).toBe(false);
  });

  it('throws when the requested king is missing', () => {
    expect(() => isInCheck(createGame([]), 'white')).toThrow('King not found on the board');
  });
});
