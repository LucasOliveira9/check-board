import { TNotation } from "src/types/square";
import { TPieceBoard } from "../../types/piece";

interface BoardHandled {
  loadPosition(b: string): void;
  flip(): void;
  getBoard(): string | null;
  getSquareCoords(notation: TNotation): { x: number; y: number } | null;
}

export type { BoardHandled };
