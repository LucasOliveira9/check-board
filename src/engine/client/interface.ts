import { TNotation } from "../../types/square";

interface BoardHandled {
  loadPosition(b: string): void;
  flip(): void;
  getBoard(): string | null;
  getSquareCoords(notation: TNotation): { x: number; y: number } | null;
}

export type { BoardHandled };
