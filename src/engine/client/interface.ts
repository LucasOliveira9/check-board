import {
  IEventListener,
  TMoveResult,
  TPieceImage,
  TPieceInternalRef,
} from "types";
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
  getSize(): { size: number; squareSize: number } | null;
  getPieceAt(
    notation: TNotation,
  ): { id: string; piece: TPieceInternalRef } | null;
  setPieceType(type: "string" | "image"): void;
  undo(): void;
  redo(): void;
  toggleHoverScaling(): void;
  toggleHoverScale(scale: number): void;
  toggleHoverHighlight(): void;
  makeMove(move: TMoveResult): boolean | Promise<boolean>;
  getEventEmitter(): IEventListener | null;
  getPiecesImage(): TPieceImage | null;
}

export type { BoardHandled };
