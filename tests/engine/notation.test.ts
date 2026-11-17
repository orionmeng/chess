import { describe, expect, it } from 'vitest';
import { createInitialGame, updateGame } from '../../src/engine/game';
import { formatFen, formatPgn, parseFen, parsePgn } from '../../src/engine/notation';

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

describe('FEN', () => {
  it('round-trips the starting position', () => {
    expect(formatFen(createInitialGame())).toBe(INITIAL_FEN);
    expect(parseFen(INITIAL_FEN)).toEqual(createInitialGame());
  });

  it('preserves explicit setup tags for the standard starting position', () => {
    const pgn = `[SetUp "1"]\n[FEN "${INITIAL_FEN}"]\n\n1. e4 *`;
    const parsed = parsePgn(pgn);
    const roundTrip = parsePgn(formatPgn(parsed.game, parsed.tags));
    expect(roundTrip.game).toEqual(parsed.game);
    expect(roundTrip.tags).toEqual(expect.objectContaining(parsed.tags));
  });

  describe('PGN mainline', () => {
    it('imports and exports a game with tags, comments, variations, and checkmate', () => {
      const text = `[Event "A \\"quoted\\" event"]
  [Result "0-1"]

  1. f3 {comment} e5 (1... d5 (1... Nf6)) 2. g4 $2 Qh4# 0-1`;
      const parsed = parsePgn(text);
      expect(parsed.game.history).toHaveLength(4);
      expect(parsed.tags.Event).toBe('A "quoted" event');
      const exported = formatPgn(parsed.game, parsed.tags);
      expect(exported).toContain('1. f3 e5 2. g4 Qh4# 0-1');
      const roundTrip = parsePgn(exported);
      expect(roundTrip.game).toEqual(parsed.game);
      expect(roundTrip.tags).toEqual(expect.objectContaining(parsed.tags));
    });

    it('supports castling in the mainline', () => {
      const pgn = '1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. O-O *';
      const parsed = parsePgn(pgn);
      expect(parsed.game.history[6].castle).toBe('kingSide');
      expect(formatPgn(parsed.game)).toContain(pgn);
    });

    it('ignores escape lines before tags and within movetext', () => {
      const parsed = parsePgn('% ignored before tags\n[Event "Test"]\n\n1. e4\n% ignored in game\n*');
      expect(parsed.tags.Event).toBe('Test');
      expect(parsed.game.history).toHaveLength(1);
    });

    it('accepts omitted check suffixes and exports canonical SAN', () => {
      const parsed = parsePgn('1. f3 e5 2. g4 Qh4 0-1');
      expect(formatPgn(parsed.game, parsed.tags)).toContain('2. g4 Qh4# 0-1');
      expect(() => parsePgn('1. f3 e5 2. g4 Qh4+ 0-1')).toThrow('Invalid or ambiguous PGN move');
    });

    it('rejects a known result that contradicts checkmate but permits an unknown result', () => {
      expect(() => parsePgn('1. f3 e5 2. g4 Qh4# 1-0')).toThrow('contradicts checkmate');
      const { game } = parsePgn('1. f3 e5 2. g4 Qh4# *');
      expect(() => formatPgn(game, { Result: '1/2-1/2' })).toThrow('contradicts checkmate');
      expect(formatPgn(game, { Result: '0-1' })).toContain('Qh4# 0-1');
    });

    it('rejects a decisive result for stalemate', () => {
      const game = parseFen('8/8/8/8/8/8/2q5/K1k5 w - - 0 1');
      expect(() => formatPgn(game, { Result: '1-0' })).toThrow('contradicts an automatic draw');
      expect(formatPgn(game, { Result: '1/2-1/2' })).toContain('1/2-1/2');
    });

    it('normalizes noncanonical FEN setup tags before round-tripping', () => {
      const pgn = '[SetUp "1"]\n[FEN "4k3/8/8/8/8/8/8/4K3  w - - 00 1"]\n\n*';
      const parsed = parsePgn(pgn);
      expect(parsed.tags.FEN).toBe('4k3/8/8/8/8/8/8/4K3 w - - 0 1');
      const roundTrip = parsePgn(formatPgn(parsed.game, parsed.tags));
      expect(roundTrip.game).toEqual(parsed.game);
      expect(roundTrip.tags).toEqual(expect.objectContaining(parsed.tags));
      expect(formatPgn(parsed.game, { SetUp: '1', FEN: '4k3/8/8/8/8/8/8/4K3 w - - 00 1' }))
        .toContain('[FEN "4k3/8/8/8/8/8/8/4K3 w - - 0 1"]');
    });

    it('round-trips an opening with captures, castling, and numbered moves', () => {
      const text = '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Bxc6 dxc6 5. O-O Qd6 6. d4 exd4 *';
      const parsed = parsePgn(text);
      expect(formatPgn(parsed.game)).toContain(text);
      expect(parsePgn(formatPgn(parsed.game)).game).toEqual(parsed.game);
    });

    it('supports en passant and a custom black-to-move FEN', () => {
      const pgn = `[SetUp "1"]
  [FEN "4k3/3p4/8/4P3/8/8/8/4K3 b - - 0 42"]
  [Result "*"]

  42... d5 43. exd6 *`;
      const parsed = parsePgn(pgn);
      expect(formatFen(parsed.game)).toBe('4k3/8/3P4/8/8/8/8/4K3 b - - 0 43');
      const output = formatPgn(parsed.game, parsed.tags);
      expect(output).toContain('42... d5 43. exd6 *');
      const roundTrip = parsePgn(output);
      expect(roundTrip.game).toEqual(parsed.game);
      expect(roundTrip.tags).toEqual(expect.objectContaining(parsed.tags));
    });

    it('records disambiguation and promotion with check', () => {
      const disambiguation = `[SetUp "1"]
  [FEN "4k3/8/8/8/8/2N1N3/8/4K3 w - - 0 1"]

  1. Ncd5 *`;
      const game = parsePgn(disambiguation).game;
      expect(formatPgn(game)).toContain('1. Ncd5 *');

      const promotion = `[SetUp "1"]
  [FEN "4k3/P7/8/8/8/8/8/4K3 w - - 0 1"]

  1. a8=Q+ *`;
      const promoted = parsePgn(promotion).game;
      expect(promoted.history[0].promotion).toBe('queen');
      expect(formatPgn(promoted)).toContain('1. a8=Q+ *');
    });

    it('uses the full source square when file and rank alone are ambiguous', () => {
      const pgn = `[SetUp "1"]
[FEN "7k/8/8/8/8/1N6/8/1N3N1K w - - 0 1"]

1. Nb1d2 *`;
      const game = parsePgn(pgn).game;
      expect(formatPgn(game)).toContain('1. Nb1d2 *');
      expect(() => parsePgn(pgn.replace('Nb1d2', 'Nd2'))).toThrow('Invalid or ambiguous PGN move');
    });

    it.each([
      '1. e5 *',
      '1. e4',
      '1. e4 * 1... e5',
      '[Result "1-0"]\n\n1. e4 0-1',
      '[SetUp "1"]\n\n*',
      '1. e4 (1. d4 *',
      '1. e4 { unfinished *',
    ])('rejects invalid PGN: %s', pgn => {
      expect(() => parsePgn(pgn)).toThrow();
    });

    it('rejects exporting a game whose recorded history does not match its position', () => {
      const game = parsePgn('1. e4 *').game;
      expect(() => formatPgn({ ...game, halfmoveClock: 10 })).toThrow('History does not match');
      expect(() => formatPgn({ ...game, positionHistory: [] })).toThrow('histories do not match');
    });
  });

  it('preserves active color, castling rights, en passant, and counters', () => {
    const fen = 'r3k2r/8/8/8/3pP3/8/8/R3K2R b Kq e3 12 35';
    const game = parseFen(fen);
    expect(formatFen(game)).toBe(fen);
    expect(game.history).toEqual([]);
    expect(game.positionHistory).toEqual([]);
  });

  it('updates the fullmove number after black moves', () => {
    const white = updateGame(createInitialGame(), {
      from: { row: 1, col: 4 }, to: { row: 3, col: 4 },
    });
    expect(formatFen(white)).toBe('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1');
    const black = updateGame(white, {
      from: { row: 6, col: 4 }, to: { row: 4, col: 4 },
    });
    expect(formatFen(black)).toBe('rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2');
  });

  it.each([
    '8/8/8/8/8/8/8/8 w - - 0 1',
    '4k3/8/8/8/8/8/8/4K3 w - - 0',
    '4k3/8/8/8/8/8/8/4K4 w - - 0 1',
    '4k3/44/8/8/8/8/8/4K3 w - - 0 1',
    '4k3/8/8/8/8/8/8/4K3 x - - 0 1',
    '4k3/8/8/8/8/8/8/4K3 w KK - 0 1',
    '4k3/8/8/8/8/8/8/4K3 w - e3 0 1',
    '4k3/8/8/8/8/8/8/4K3 w - - -1 1',
    '4k3/8/8/8/8/8/8/4K3 w - - 0 0',
  ])('rejects invalid FEN: %s', fen => {
    expect(() => parseFen(fen)).toThrow();
  });
});
