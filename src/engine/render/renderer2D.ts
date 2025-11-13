import Utils from "../../utils/utils";
import { TCanvasCoords, TCanvasLayer, TRender } from "../../types/draw";
import {
  TPiece,
  TPieceBoard,
  TPieceCoords,
  TPieceId,
  TPieceInternalRef,
  TPieceType,
} from "../../types/piece";
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

  protected staticToRender: Map<TPieceId, TRender> = new Map();
  protected dynamicToRender: Map<TPieceId, TRender> = new Map();
  protected staticCoordsMap: Map<TPieceId, TPieceCoords> = new Map();
  protected dynamicCoordsMap: Map<TPieceId, TPieceCoords> = new Map();
  protected dynamicToClear: TCanvasCoords[] = [];
  protected staticToClear: TCanvasCoords[] = [];
  protected boardToClear: TCanvasCoords[] = [];
  protected upOverlayToClear: TCanvasCoords[] = [];
  protected downOverlayToClear: TCanvasCoords[] = [];

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
    const boardRuntime = this.boardRuntime,
      canvasLayers = boardRuntime.getCanvasLayers();
    if (!canvasLayers) return;
    const canvas = canvasLayers.getCanvas("board").current;
    if (!canvas) return;
    canvasLayers?.keepQuality("board", boardRuntime.getSize());
    boardRuntime.draw.board();
  }

  addStaticPiece(id: TPieceId, piece: TPieceInternalRef) {
    piece && this.addStaticPosition(id, { x: piece.x, y: piece.y });
    if (!piece) return;
    this.staticToRender.set(id, {
      piece,
      x: piece.x,
      y: piece.y,
    });
    this.staticPieces[id] = piece;
  }

  addDynamicPiece(id: TPieceId, piece: TPieceInternalRef) {
    piece && this.addDynamicPosition(id, { x: piece.x, y: piece.y });
    if (!piece || this.dynamicPieces[id]) return;
    this.dynamicToRender.set(id, {
      piece,
      x: piece.x,
      y: piece.y,
    });
    this.dynamicPieces[id] = piece;
  }

  addStaticPosition(id: TPieceId, coords: TPieceCoords) {
    this.staticCoordsMap.set(id, coords);
  }

  addDynamicPosition(id: TPieceId, coords: TPieceCoords) {
    this.dynamicCoordsMap.set(id, coords);
  }

  addStaticToClear(coords: TCanvasCoords) {
    this.staticToClear.push(coords);
  }

  addDynamicToClear(coords: TCanvasCoords) {
    this.dynamicToClear.push(coords);
  }

  deleteStaticPosition(id: TPieceId) {
    this.staticCoordsMap.delete(id);
  }

  deleteDynamicPosition(id: TPieceId) {
    this.dynamicCoordsMap.delete(id);
  }

  getStaticPosition(id: TPieceId) {
    return Utils.deepFreeze(this.staticCoordsMap.get(id));
  }

  getDynamicPosition(id: TPieceId) {
    return Utils.deepFreeze(this.dynamicCoordsMap.get(id));
  }

  getAllDynamicCoords() {
    return Utils.deepFreeze(this.dynamicCoordsMap.entries());
  }

  getAllStaticCoords() {
    return Utils.deepFreeze(this.staticCoordsMap.entries());
  }

  getStaticToClear() {
    return this.staticToClear;
  }

  getDynamicToClear() {
    return this.dynamicToClear;
  }

  deleteStaticPiece(id: TPieceId) {
    const piece = this.staticPieces[id];
    const squareSize = this.boardRuntime.getSize() / 8;
    if (!piece) return;
    this.addStaticToClear({
      x: piece.x,
      y: piece.y,
      w: squareSize,
      h: squareSize,
    });
    this.deleteStaticPosition(id);
    this.staticToRender.delete(id);
    delete this.staticPieces[id];
  }

  clearStaticPieces(board: TPieceBoard[]) {
    const newStaticPieces = {} as Record<TPieceId, TPieceInternalRef>;
    const clear: { id: TPieceId; piece: TPieceInternalRef }[] = [];
    const squareSize = this.boardRuntime.getSize() / 8;
    for (const piece of board) {
      const hasId = this.staticPieces[piece.id];
      hasId && hasId.square.notation !== piece.square.notation
        ? clear.push(structuredClone({ id: piece.id, piece: hasId }))
        : null;
      if (hasId) newStaticPieces[piece.id] = hasId;
      delete this.staticPieces[piece.id];
    }

    for (const [_, piece] of Object.entries(this.staticPieces))
      this.addStaticToClear({
        x: piece.x,
        y: piece.y,
        w: squareSize,
        h: squareSize,
      });

    for (const obj of clear)
      this.addStaticToClear({
        x: obj.piece.x,
        y: obj.piece.y,
        w: squareSize,
        h: squareSize,
      });

    this.staticPieces = structuredClone(newStaticPieces);
  }

  clearRect(coords: TCanvasCoords, canvas: TCanvasLayer) {
    const { x, y, w, h } = coords;
    const canvasLayers = this.boardRuntime.getCanvasLayers();
    const ctx = canvasLayers.getContext(canvas);
    const dpr = canvasLayers.getDpr();
    ctx?.save();
    ctx?.setTransform(1, 0, 0, 1, 0, 0);
    ctx?.clearRect(x * dpr, y * dpr, w * dpr, h * dpr);
    ctx?.restore();
  }

  resetStaticPieces() {
    this.staticPieces = {} as Record<TPieceId, TPieceInternalRef>;
    this.staticToRender.clear();
    this.staticCoordsMap.clear();
    this.dynamicCoordsMap.clear();
  }

  resetDynamicToClear() {
    this.dynamicToClear = [];
  }

  resetStaticToClear() {
    this.staticToClear = [];
  }

  deleteDynamicPiece(id: TPieceId) {
    const piece = this.dynamicPieces[id];
    const squareSize = this.boardRuntime.getSize() / 8;
    if (!piece) return;
    this.addDynamicToClear({
      x: piece.x,
      y: piece.y,
      w: squareSize,
      h: squareSize,
    });
    this.deleteDynamicPosition(id);
    this.dynamicToRender.delete(id);
    delete this.dynamicPieces[id];
  }

  clearStaticToRender() {
    this.staticToRender.clear();
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

  getDynamicToRender() {
    return this.dynamicToRender;
  }

  clear(): void {
    throw new Error("Method not implemented.");
  }
}

export default Renderer2D;
