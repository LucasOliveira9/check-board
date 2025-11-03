import { TRender } from "../../types/draw";
import { TPieceBoard, TPieceId, TPieceInternalRef } from "../../types/piece";

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
  clearStaticPiecesRect(x: number, y: number): void;
  resetStaticPieces(): void;
  getStaticToRender(): TRender[];
  clearStaticPieces(board: TPieceBoard[]): void;
}

export { IRenderer, IRenderer2D };
