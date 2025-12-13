import { TPieceInternalRef } from "types";
import { TNotation } from "../../types/square";

interface BoardHandled {
  loadPosition(b: string, f?: boolean): void;
  flip(): void;
  getBoard(): string | null;
  getSquareCoords(notation: TNotation): { x: number; y: number } | null;
  togglePause(): void;
  loadFenStream(b: string[]): void;
  setfenStreamDelay(n: number): void;
  updateSize(size: number): void;
  getPieceAt(
    notation: TNotation
  ): { id: string; piece: TPieceInternalRef } | null;
}

export type { BoardHandled };
