import { TEvents } from "src/types/events";
import { TCanvasCoords, TCanvasLayer, TRender } from "../../types/draw";
import {
  TPieceBoard,
  TPieceCoords,
  TPieceId,
  TPieceInternalRef,
  TPieceType,
} from "../../types/piece";

interface IRenderer {
  renderStaticPieces(): void;
  renderUnderlay(): void;
  renderBoard(): void;
  renderDynamicPieces(): void;
  renderOverlay(): void;
  renderClientOverlayEvents(): void;
  addDynamicPiece(id: TPieceId, piece: TPieceInternalRef): void;
  addStaticPiece(id: TPieceId, piece: TPieceInternalRef): void;
  deleteStaticPiece(id: TPieceId): void;
  deleteDynamicPiece(id: TPieceId): void;
  getDynamicPieceObj(): Record<TPieceId, TPieceInternalRef>;
  getStaticPieceObj(): Record<TPieceId, TPieceInternalRef>;
  clear(): void;
  destroy(): void;
}

interface IRenderer2D extends IRenderer {
  clearStaticToRender(): void;
  clearRect(coords: TCanvasCoords, canvas: TCanvasLayer): void;
  resetStaticPieces(): void;
  getToRender(canvas: TCanvasLayer): Map<TPieceId, TRender>;
  getPosition(
    id: TPieceId,
    canvas: TCanvasLayer
  ): { readonly x: number; readonly y: number } | undefined;
  clearStaticPieces(board: TPieceBoard[]): void;
  addPosition(id: TPieceId, coords: TPieceCoords, canvas: TCanvasLayer): void;
  addToClear(coords: TCanvasCoords, canvas: TCanvasLayer): void;
  addEvent(
    key: TEvents,
    opts: { canvas: TCanvasLayer; coords: TCanvasCoords }
  ): void;
  addAnimation(
    key: string,
    opts: { canvas: TCanvasLayer; coords: TCanvasCoords }
  ): void;
  clearEvent(key: TEvents): void;
  clearAnimation(key: string): void;
  getToClear(canvas: TCanvasLayer): TCanvasCoords[];
  resetToClear(canvas: TCanvasLayer): void;
}

export { IRenderer, IRenderer2D };
