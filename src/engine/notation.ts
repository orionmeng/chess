import { createEmptyBoard } from './board';
import { createInitialGame, updateGame } from './game';
import { getPieceAt } from './pieces';
import {
  getLegalMoves, isCheckmate, isFivefoldRepetition, isInCheck, isSeventyFiveMoveRule, isStalemate,
} from './rules';
import type { Color, GameState, Move, Piece, PieceType, PromotionPieceType, Square } from './types';

const FILES = 'abcdefgh';
const PIECE_TYPES: Record<string, PieceType> = {
  p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king',
};
const PIECE_LETTERS: Record<PieceType, string> = {
  pawn: 'p', knight: 'n', bishop: 'b', rook: 'r', queen: 'q', king: 'k',
};

function parseSquare(text: string): Square {
  if (!/^[a-h][1-8]$/.test(text)) {
    throw new Error(`Invalid square: ${text}`);
  }
  return { row: Number(text[1]) - 1, col: FILES.indexOf(text[0]) };
}

function formatSquare(square: Square): string {
  return `${FILES[square.col]}${square.row + 1}`;
}

// FEN contains one position, not the moves or repetition history leading to it.
export function parseFen(fen: string): GameState {
  const fields = fen.trim().split(/\s+/);
  if (fields.length !== 6) {
    throw new Error('FEN must contain six fields');
  }
  const [placement, turn, castling, enPassant, halfmove, fullmove] = fields;
  const ranks = placement.split('/');
  if (ranks.length !== 8) {
    throw new Error('FEN must contain eight ranks');
  }
  const board = createEmptyBoard();
  const kings = { white: 0, black: 0 };
  for (let rank = 0; rank < 8; rank++) {
    let col = 0;
    if (/[1-8]{2}/.test(ranks[rank])) {
      throw new Error('Invalid FEN piece placement');
    }
    for (const char of ranks[rank]) {
      if (/^[1-8]$/.test(char)) {
        col += Number(char);
      } else {
        const type = PIECE_TYPES[char.toLowerCase()];
        if (!type || col >= 8) {
          throw new Error('Invalid FEN piece placement');
        }
        const color: Color = char === char.toUpperCase() ? 'white' : 'black';
        const piece: Piece = { type, color };
        board[(7 - rank) * 8 + col] = piece;
        if (type === 'king') kings[color]++;
        col++;
      }
    }
    if (col !== 8) {
      throw new Error('FEN rank must contain eight squares');
    }
  }
  if (kings.white !== 1 || kings.black !== 1) {
    throw new Error('FEN must contain one king of each color');
  }
  if (turn !== 'w' && turn !== 'b') {
    throw new Error('Invalid FEN active color');
  }
  if (!/^(?:-|K?Q?k?q?)$/.test(castling) || castling === '') {
    throw new Error('Invalid FEN castling rights');
  }
  const target = enPassant === '-' ? null : parseSquare(enPassant);
  if (target && (target.row !== (turn === 'w' ? 5 : 2) || board[target.row * 8 + target.col])) {
    throw new Error('Invalid FEN en passant target');
  }
  if (!/^\d+$/.test(halfmove) || !/^[1-9]\d*$/.test(fullmove)
    || !Number.isSafeInteger(Number(halfmove)) || !Number.isSafeInteger(Number(fullmove))) {
    throw new Error('Invalid FEN move counters');
  }
  return {
    board,
    activeColor: turn === 'w' ? 'white' : 'black',
    castlingRights: {
      whiteKingSide: castling.includes('K'),
      whiteQueenSide: castling.includes('Q'),
      blackKingSide: castling.includes('k'),
      blackQueenSide: castling.includes('q'),
    },
    enPassantTarget: target,
    halfmoveClock: Number(halfmove),
    fullmoveNumber: Number(fullmove),
    history: [],
    positionHistory: [],
  };
}

export function formatFen(game: GameState): string {
  const ranks: string[] = [];
  for (let row = 7; row >= 0; row--) {
    let rank = '';
    let empty = 0;
    for (let col = 0; col < 8; col++) {
      const piece = game.board[row * 8 + col];
      if (!piece) {
        empty++;
      } else {
        if (empty) rank += empty;
        empty = 0;
        const letter = PIECE_LETTERS[piece.type];
        rank += piece.color === 'white' ? letter.toUpperCase() : letter;
      }
    }
    if (empty) rank += empty;
    ranks.push(rank);
  }
  const rights = game.castlingRights;
  const castling = (rights.whiteKingSide ? 'K' : '') + (rights.whiteQueenSide ? 'Q' : '')
    + (rights.blackKingSide ? 'k' : '') + (rights.blackQueenSide ? 'q' : '');
  return [
    ranks.join('/'), game.activeColor === 'white' ? 'w' : 'b', castling || '-',
    game.enPassantTarget ? formatSquare(game.enPassantTarget) : '-',
    game.halfmoveClock, game.fullmoveNumber,
  ].join(' ');
}

const PROMOTIONS: PromotionPieceType[] = ['queen', 'rook', 'bishop', 'knight'];
const RESULTS = ['1-0', '0-1', '1/2-1/2', '*'];
export type PgnGame = { game: GameState; tags: Record<string, string> };

function validatePgnResult(game: GameState, result: string): void {
  if (result === '*') return;
  if (isCheckmate(game)) {
    const winner = game.activeColor === 'white' ? '0-1' : '1-0';
    if (result !== winner) throw new Error('PGN result contradicts checkmate');
  } else if ((isStalemate(game) || isFivefoldRepetition(game) || isSeventyFiveMoveRule(game))
    && result !== '1/2-1/2') {
    throw new Error('PGN result contradicts an automatic draw');
  }
}

function legalMoves(game: GameState): Move[] {
  const moves: Move[] = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const from = { row, col };
      const piece = getPieceAt(game.board, from, 8);
      if (!piece || piece.color !== game.activeColor) continue;
      for (const to of getLegalMoves(game, from)) {
        if (piece.type === 'pawn' && (to.row === 0 || to.row === 7)) {
          for (const promotion of PROMOTIONS) moves.push({ from, to, promotion });
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

function san(game: GameState, move: Move): string {
  const piece = getPieceAt(game.board, move.from, 8);
  if (!piece) throw new Error('No piece at SAN move source');
  let text: string;
  if (move.castle) {
    text = move.castle === 'kingSide' ? 'O-O' : 'O-O-O';
  } else {
    const capture = !!getPieceAt(game.board, move.to, 8)
      || (piece.type === 'pawn' && move.from.col !== move.to.col);
    let prefix = piece.type === 'pawn' ? '' : PIECE_LETTERS[piece.type].toUpperCase();
    if (piece.type === 'pawn' && capture) {
      prefix = FILES[move.from.col];
    } else if (piece.type !== 'pawn' && piece.type !== 'king') {
      const alternatives: Square[] = [];
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const from = { row, col };
          const other = getPieceAt(game.board, from, 8);
          if ((row !== move.from.row || col !== move.from.col)
            && other?.color === piece.color && other.type === piece.type
            && getLegalMoves(game, from).some(to => to.row === move.to.row && to.col === move.to.col)) {
            alternatives.push(from);
          }
        }
      }
      if (alternatives.length) {
        if (alternatives.every(other => other.col !== move.from.col)) {
          prefix += FILES[move.from.col];
        } else if (alternatives.every(other => other.row !== move.from.row)) {
          prefix += move.from.row + 1;
        } else {
          prefix += formatSquare(move.from);
        }
      }
    }
    text = prefix + (capture ? 'x' : '') + formatSquare(move.to);
    if (move.promotion) text += `=${PIECE_LETTERS[move.promotion].toUpperCase()}`;
  }
  const next = updateGame(game, move);
  if (isCheckmate(next)) return text + '#';
  return isInCheck(next, next.activeColor) ? text + '+' : text;
}

function pgnMainline(text: string): string {
  let output = '';
  let depth = 0;
  let comment = false;
  let lineComment = false;
  for (const char of text) {
    if (lineComment) {
      if (char === '\n' || char === '\r') {
        lineComment = false;
        output += ' ';
      }
    } else if (comment) {
      if (char === '}') comment = false;
    } else if (char === '{') {
      comment = true;
      output += ' ';
    } else if (char === ';') {
      lineComment = true;
      output += ' ';
    } else if (char === '(') {
      depth++;
      output += ' ';
    } else if (char === ')') {
      if (depth === 0) throw new Error('Unmatched PGN variation');
      depth--;
      output += ' ';
    } else if (char === '}') {
      throw new Error('Unmatched PGN comment');
    } else if (depth === 0) {
      output += char;
    }
  }
  if (comment || depth) throw new Error('Unterminated PGN comment or variation');
  return output;
}

// Reads one PGN mainline. Comments, NAGs, and variations are discarded.
export function parsePgn(pgn: string): PgnGame {
  let rest = pgn.replace(/^%[^\r\n]*(?:\r\n|\r|\n|$)/gm, '').trimStart();
  const tags: Record<string, string> = Object.create(null);
  while (rest.startsWith('[')) {
    const match = /^\[([A-Za-z0-9_]+)\s+"((?:[^"\\\r\n]|\\["\\])*)"\s*\]\s*/.exec(rest);
    if (!match) throw new Error('Invalid PGN tag');
    if (Object.hasOwn(tags, match[1])) throw new Error(`Duplicate PGN tag: ${match[1]}`);
    tags[match[1]] = match[2].replace(/\\(["\\])/g, '$1');
    rest = rest.slice(match[0].length);
  }
  if ((tags.SetUp === '1') !== (tags.FEN !== undefined)
    || (tags.SetUp !== undefined && tags.SetUp !== '0' && tags.SetUp !== '1')) {
    throw new Error('PGN SetUp and FEN tags must describe the starting position');
  }
  let game = tags.FEN !== undefined ? parseFen(tags.FEN) : createInitialGame();
  if (tags.FEN !== undefined) tags.FEN = formatFen(game);
  let result: string | undefined;
  const mainline = pgnMainline(rest).replace(/\$\d+/g, ' ');
  for (let token of mainline.split(/\s+/).filter(Boolean)) {
    token = token.replace(/^\d+\.(?:\.\.)?/, '');
    if (!token || token === '...') continue;
    if (result !== undefined) throw new Error('Unexpected text after PGN result');
    if (RESULTS.includes(token)) {
      result = token;
      continue;
    }
    const normalized = token.replace(/[!?]+$/, '').replace(/^0-0-0/, 'O-O-O').replace(/^0-0/, 'O-O');
    const candidates = legalMoves(game).filter(move => {
      const notation = san(game, move);
      return notation === normalized
        || (!/[+#]$/.test(normalized) && notation.replace(/[+#]$/, '') === normalized);
    });
    if (candidates.length !== 1) throw new Error(`Invalid or ambiguous PGN move: ${token}`);
    game = updateGame(game, candidates[0]);
  }
  if (result === undefined) throw new Error('PGN result is missing');
  if (tags.Result !== undefined && tags.Result !== result) throw new Error('PGN result does not match tag');
  validatePgnResult(game, result);
  tags.Result = result;
  return { game, tags };
}

// Writes a mainline from the recorded starting position and move history.
export function formatPgn(game: GameState, inputTags: Record<string, string> = {}): string {
  if (game.history.length !== game.positionHistory.length) {
    throw new Error('Move and position histories do not match');
  }
  const start = game.positionHistory[0];
  let current: GameState = start
    ? { ...start, history: [], positionHistory: [] }
    : { ...game, history: [], positionHistory: [] };
  const startFen = formatFen(current);
  const tags: Record<string, string> = {
    Event: '?',
    Site: '?',
    Date: '????.??.??',
    Round: '?',
    White: '?',
    Black: '?',
    Result: '*',
    ...inputTags,
  };
  if (!RESULTS.includes(tags.Result)) throw new Error('Invalid PGN result');
  const isCustom = startFen !== formatFen(createInitialGame());
  if ((tags.FEN !== undefined && formatFen(parseFen(tags.FEN)) !== startFen)
    || (tags.SetUp !== undefined && tags.SetUp !== '0' && tags.SetUp !== '1')
    || (tags.SetUp === '0' && (isCustom || tags.FEN !== undefined))) {
    throw new Error('PGN setup tags do not match the starting position');
  }
  if (isCustom || tags.FEN !== undefined || tags.SetUp === '1') {
    tags.SetUp = '1';
    tags.FEN = startFen;
  }
  const moves: string[] = [];
  for (const move of game.history) {
    if (!legalMoves(current).some(candidate =>
      candidate.from.row === move.from.row && candidate.from.col === move.from.col
      && candidate.to.row === move.to.row && candidate.to.col === move.to.col
      && candidate.promotion === move.promotion && candidate.castle === move.castle)) {
      throw new Error('History contains an illegal move');
    }
    if (current.activeColor === 'white') moves.push(`${current.fullmoveNumber}.`);
    else if (!moves.length) moves.push(`${current.fullmoveNumber}...`);
    moves.push(san(current, move));
    current = updateGame(current, move);
  }
  if (formatFen(current) !== formatFen(game)) throw new Error('History does not match the current position');
  validatePgnResult(current, tags.Result);
  const headers = Object.entries(tags).map(([name, value]) => {
    if (!/^[A-Za-z0-9_]+$/.test(name) || /[\r\n]/.test(value)) throw new Error('Invalid PGN tag');
    return `[${name} "${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"]`;
  });
  return `${headers.join('\n')}\n\n${[...moves, tags.Result].join(' ')}`;
}
