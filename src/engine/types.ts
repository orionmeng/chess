// Example: domain types for a turn-based grid tactics game.
// type Team = 'sun' | 'moon';
// type UnitKind = 'scout' | 'guardian' | 'mage';
//
// type GridPosition = {
//   row: number;
//   column: number;
// };
//
// type Unit = {
//   team: Team;
//   kind: UnitKind;
// };
//
// type Action = {
//   from: GridPosition;
//   to: GridPosition;
// };
//
// type MatchState = {
//   activeTeam: Team;
//   units: Array<Unit | null>;
//   previousActions: Action[];
// };

export type Color = 'white' | 'black';
export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
export type Piece = { color: Color; type: PieceType };
export type Square = { row: number; col: number };
export type Move = { from: Square; to: Square };
export type GameState = { activeColor: Color; board: Array<Piece | null>; history: Move[] };
