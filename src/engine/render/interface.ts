import { TCanvasClear, TCanvasLayer, TRender } from "../../types/draw";
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
  clearPiecesRect(x: number, y: number, id: TPieceId, type: TPieceType): void;
  clearStaticToRender(): void;
  clearHover(): void;
  clearRect(coords: TCanvasClear, canvas: TCanvasLayer): void;
  addHoverToClear(coords: TCanvasClear): void;
  resetStaticPieces(): void;
  getStaticToRender(): Map<TPieceId, TRender>;
  getDynamicToRender(): Map<TPieceId, TRender>;
  getStaticToClear(): Set<TPieceId>;
  getDynamicToClear(): Set<TPieceId>;
  getDynamicPosition(
    id: TPieceId
  ): { readonly x: number; readonly y: number } | undefined;
  getStaticPosition(
    id: TPieceId
  ): { readonly x: number; readonly y: number } | undefined;
  clearStaticPieces(board: TPieceBoard[]): void;
  addStaticToClear(id: TPieceId): void;
  addDynamicToClear(id: TPieceId): void;
  addDynamicPosition(id: TPieceId, coords: TPieceCoords): void;
  addStaticPosition(id: TPieceId, coords: TPieceCoords): void;
  deleteStaticToClear(id: TPieceId): void;
  deleteDynamicToClear(id: TPieceId): void;
}

export { IRenderer, IRenderer2D };
