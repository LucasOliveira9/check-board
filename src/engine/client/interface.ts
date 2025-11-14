import { TNotation } from "src/types/square";
import { TPieceBoard } from "../../types/piece";

interface BoardHandled {
  loadPosition(b: TPieceBoard[]): void;
  flip(): void;
  getBoard(): readonly TPieceBoard[] | null;
  getSquareCoords(notation: TNotation): { x: number; y: number } | null;
}

export type { BoardHandled };
