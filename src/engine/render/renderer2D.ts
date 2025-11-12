import Utils from "../../utils/utils";
import { TCanvasClear, TCanvasLayer, TRender } from "../../types/draw";
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
  protected dynamicToClear: Set<TPieceId> = new Set();
  protected staticToClear: Set<TPieceId> = new Set();
  protected hoverToClear: TCanvasClear[] = [];

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
    if (!piece || this.staticPieces[id]) return;
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

  addStaticToClear(id: TPieceId) {
    !this.staticToClear.has(id) && this.staticToClear.add(id);
  }

  addDynamicToClear(id: TPieceId) {
    !this.dynamicToClear.has(id) && this.dynamicToClear.add(id);
  }

  addHoverToClear(coords: TCanvasClear) {
    this.hoverToClear.push(coords);
  }

  clearHover() {
    for (const coords of this.hoverToClear)
      this.clearRect(coords, "dynamicPieces");

    this.hoverToClear = [];
  }

  deleteStaticToClear(id: TPieceId) {
    this.staticToClear.delete(id);
  }

  deleteDynamicToClear(id: TPieceId) {
    this.dynamicToClear.delete(id);
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
    //const piece = this.staticToRender.find((obj) => obj.id === id);
    //piece && this.clearStaticPiecesRect(piece.piece.x, piece.piece.y);
    this.addStaticToClear(id);
    delete this.staticPieces[id];
  }

  clearStaticPieces(board: TPieceBoard[]) {
    const newStaticPieces = {} as Record<TPieceId, TPieceInternalRef>;
    const clear: { id: TPieceId; piece: TPieceInternalRef }[] = [];
    for (const piece of board) {
      const hasId = this.staticPieces[piece.id];
      hasId && hasId.square.notation !== piece.square.notation
        ? clear.push(structuredClone({ id: piece.id, piece: hasId }))
        : null;
      if (hasId) newStaticPieces[piece.id] = hasId;
      delete this.staticPieces[piece.id];
    }

    for (const [id, _] of Object.entries(this.staticPieces))
      this.addStaticToClear(id as TPieceId);

    for (const obj of clear) this.addStaticToClear(obj.id);

    this.staticPieces = structuredClone(newStaticPieces);
  }

  clearRect(coords: TCanvasClear, canvas: TCanvasLayer) {
    const { x, y, w, h } = coords;
    const canvasLayers = this.boardRuntime.getCanvasLayers();
    const ctx = canvasLayers.getContext(canvas);
    const dpr = canvasLayers.getDpr();
    ctx?.save();
    ctx?.setTransform(1, 0, 0, 1, 0, 0);
    ctx?.clearRect(x * dpr, y * dpr, w * dpr, h * dpr);
    ctx?.restore();
  }

  clearPiecesRect(x: number, y: number, id: TPieceId, type: TPieceType) {
    const canvasLayers = this.boardRuntime.getCanvasLayers();
    const ctx =
      type === "static"
        ? canvasLayers.getContext("pieces")
        : canvasLayers.getContext("dynamicPieces");
    const dpr = canvasLayers.getDpr();
    const squareSize = this.boardRuntime.getSize() / 8;

    ctx?.save();
    ctx?.setTransform(1, 0, 0, 1, 0, 0);
    ctx?.clearRect(x * dpr, y * dpr, squareSize * dpr, squareSize * dpr);
    ctx?.restore();

    if (type === "static") {
      !this.staticPieces[id] && this.deleteStaticPosition(id);
      this.deleteStaticToClear(id);
    } else {
      !this.dynamicPieces[id] && this.deleteDynamicPosition(id);
      this.deleteDynamicToClear(id);
    }
  }

  clearDynamicPiecesRect(x: number, y: number, id: TPieceId) {
    const canvasLayers = this.boardRuntime.getCanvasLayers();
    const ctx = canvasLayers.getContext("dynamicPieces");
    const dpr = canvasLayers.getDpr();
    const squareSize = this.boardRuntime.getSize() / 8;
    ctx?.save();
    ctx?.setTransform(1, 0, 0, 1, 0, 0);

    ctx?.clearRect(x * dpr, y * dpr, squareSize * dpr, squareSize * dpr);
    ctx?.restore();

    !this.dynamicPieces[id] && this.deleteDynamicPosition(id);
    this.deleteDynamicToClear(id);
  }

  resetStaticPieces() {
    this.staticPieces = {} as Record<TPieceId, TPieceInternalRef>;
    this.staticToRender.clear();
    this.staticCoordsMap.clear();
    this.dynamicCoordsMap.clear();
  }

  deleteDynamicPiece(id: TPieceId) {
    if (!this.dynamicPieces[id]) return;
    this.addDynamicToClear(id);
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
