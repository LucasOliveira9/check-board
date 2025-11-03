import { TPieceId, TPieceInternalRef } from "src/types/piece";
import BoardRuntime from "../BoardRuntime/BoardRuntime";
import { IRenderer } from "./interface";

class Renderer3D implements IRenderer {
  constructor(protected boardRuntime: BoardRuntime) {}
  getDynamicPieceObj(): Record<TPieceId, TPieceInternalRef> {
    throw new Error("Method not implemented.");
  }
  getStaticPieceObj(): Record<TPieceId, TPieceInternalRef> {
    throw new Error("Method not implemented.");
  }
  addDynamicPiece(id: TPieceId, piece: TPieceInternalRef): void {
    throw new Error("Method not implemented.");
  }
  addStaticPiece(
    id: TPieceId,
    piece: TPieceInternalRef,
    opt?: string
  ): boolean {
    throw new Error("Method not implemented.");
  }
  deleteStaticPiece(id: TPieceId): void {
    throw new Error("Method not implemented.");
  }
  deleteDynamicPiece(id: TPieceId): void {
    throw new Error("Method not implemented.");
  }
  destroy(): void {
    for (const key of Object.getOwnPropertyNames(this)) {
      (this as any)[key] = null;
    }
  }
  renderStaticPieces(): void {
    throw new Error("Method not implemented.");
  }
  renderDownOverlay(): void {
    throw new Error("Method not implemented.");
  }
  renderBoard(): void {
    throw new Error("Method not implemented.");
  }
  renderUpOverlayAndDynamicPieces(): void {
    throw new Error("Method not implemented.");
  }
  clear(): void {
    throw new Error("Method not implemented.");
  }
}

export default Renderer3D;
