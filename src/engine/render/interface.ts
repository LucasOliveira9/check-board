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
  renderDownOverlay(): void;
  renderBoard(): void;
  renderDynamicPieces(): void;
  renderUpOverlay(): void;
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
  getStaticToRender(): Map<TPieceId, TRender>;
  getDynamicToRender(): Map<TPieceId, TRender>;
  getStaticToClear(): TCanvasCoords[];
  getDynamicToClear(): TCanvasCoords[];
  getDynamicPosition(
    id: TPieceId
  ): { readonly x: number; readonly y: number } | undefined;
  getStaticPosition(
    id: TPieceId
  ): { readonly x: number; readonly y: number } | undefined;
  clearStaticPieces(board: TPieceBoard[]): void;
  addStaticToClear(coords: TCanvasCoords): void;
  addDynamicToClear(coords: TCanvasCoords): void;
  addDynamicPosition(id: TPieceId, coords: TPieceCoords): void;
  addStaticPosition(id: TPieceId, coords: TPieceCoords): void;
  resetDynamicToClear(): void;
  resetStaticToClear(): void;
}

export { IRenderer, IRenderer2D };
