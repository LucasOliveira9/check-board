import { TRender } from "../../types/draw";
import { TPieceBoard, TPieceId, TPieceInternalRef } from "../../types/piece";
import BoardRuntime from "../BoardRuntime/BoardRuntime";
import { IRenderer, IRenderer2D } from "./interface";

class Renderer2D implements IRenderer2D {
  protected staticPieces: Record<TPieceId, TPieceInternalRef> = {} as Record<
    TPieceId,
    TPieceInternalRef
  >;

  protected dynamicPieces: Record<TPieceId, TPieceInternalRef> = {} as Record<
    TPieceId,
    TPieceInternalRef
  >;

  protected staticToRender: TRender[] = [];
  protected dynamicToRender: TRender[] = [];

  constructor(protected boardRuntime: BoardRuntime) {}
  renderDynamicPieces(): void {
    const boardRuntime = this.boardRuntime,
      canvasLayers = boardRuntime.getCanvasLayers(),
      animation = boardRuntime.getAnimation(),
      animationRef = boardRuntime.getAnimationRef();
    const canvas = canvasLayers.getCanvas("dynamicPieces").current;
    if (canvas === null) return;
    canvasLayers.keepQuality("dynamicPieces", boardRuntime.getSize());

    if (animation.length <= 0) {
      boardRuntime.clearAnimation();
      boardRuntime.draw.pieces("dynamic");
      return;
    }
    const render = (time: number) => {
      if (animation.length > 0)
        boardRuntime.setAnimationRef(requestAnimationFrame(render));
      else boardRuntime.clearAnimation();

      boardRuntime.draw.pieces("dynamic", time);
    };
    if (!animationRef && animation.length)
      boardRuntime.setAnimationRef(requestAnimationFrame(render));
  }
  renderUpOverlay(): void {
    throw new Error("Method not implemented.");
  }
  destroy(): void {
    for (const key of Object.getOwnPropertyNames(this)) {
      (this as any)[key] = null;
    }
  }
  renderStaticPieces(): void {
    const boardRuntime = this.boardRuntime,
      canvasLayers = boardRuntime.getCanvasLayers();
    const canvas = canvasLayers.getCanvas("pieces").current;
    if (canvas === null) return;
    canvasLayers.keepQuality("pieces", boardRuntime.getSize());

    boardRuntime.draw.pieces("static");
  }
  renderDownOverlay(): void {
    const boardRuntime = this.boardRuntime,
      canvasLayers = boardRuntime.getCanvasLayers();
    const canvas = canvasLayers.getCanvas("overlay").current;
    if (!canvas === null) return;
    canvasLayers.keepQuality("overlay", boardRuntime.getSize());
    canvasLayers.keepQuality("overlayUp", boardRuntime.getSize());

    boardRuntime.draw.overlay();
  }
  renderBoard(): void {
    throw new Error("Method not implemented.");
  }

  addStaticPiece(id: TPieceId, piece: TPieceInternalRef, opt?: string) {
    if (!piece || this.staticPieces[id]) return false;
    const squareSize = this.boardRuntime.getSize() / 8;
    this.staticToRender.push({
      id,
      piece,
      x: piece.x,
      y: piece.y,
      width: squareSize,
      height: squareSize,
    });
    this.staticPieces[id] = piece;
    return true;
  }

  addDynamicPiece(id: TPieceId, piece: TPieceInternalRef) {
    this.dynamicPieces[id] = piece;
  }

  deleteStaticPiece(id: TPieceId) {
    const piece = this.staticToRender.find((obj) => obj.id === id);
    piece && this.clearStaticPiecesRect(piece.piece.x, piece.piece.y);

    delete this.staticPieces[id];
  }

  clearStaticPieces(board: TPieceBoard[]) {
    const newStaticPieces = {} as Record<TPieceId, TPieceInternalRef>;
    const clear: TPieceInternalRef[] = [];
    for (const piece of board) {
      const hasId = this.staticPieces[piece.id];
      hasId && hasId.square.notation !== piece.square.notation
        ? clear.push(structuredClone(hasId))
        : null;
      if (hasId) newStaticPieces[piece.id] = hasId;
      delete this.staticPieces[piece.id];
    }

    for (const piece of clear) this.clearStaticPiecesRect(piece.x, piece.y);

    this.staticPieces = structuredClone(newStaticPieces);
  }

  clearStaticPiecesRect(x: number, y: number) {
    const canvasLayers = this.boardRuntime.getCanvasLayers();
    const ctx = canvasLayers.getContext("pieces");
    const dpr = canvasLayers.getDpr();
    const squareSize = this.boardRuntime.getSize() / 8;
    ctx?.save();
    ctx?.setTransform(1, 0, 0, 1, 0, 0);

    ctx?.clearRect(x * dpr, y * dpr, squareSize * dpr, squareSize * dpr);
    ctx?.restore();
  }

  resetStaticPieces() {
    this.staticPieces = {} as Record<TPieceId, TPieceInternalRef>;
    this.staticToRender = [];
  }

  deleteDynamicPiece(id: TPieceId) {
    delete this.dynamicPieces[id];
  }

  clearStaticToRender() {
    this.staticToRender = [];
  }

  getDynamicPieceObj() {
    return this.dynamicPieces;
  }

  getStaticPieceObj() {
    return this.staticPieces;
  }

  getStaticToRender() {
    return this.staticToRender;
  }

  clear(): void {
    throw new Error("Method not implemented.");
  }
}

export default Renderer2D;
