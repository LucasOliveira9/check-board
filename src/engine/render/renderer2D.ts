import Utils from "../../utils/utils";
import { TCanvasCoords, TCanvasLayer, TRender } from "../../types/draw";
import {
  TPieceBoard,
  TPieceCoords,
  TPieceId,
  TPieceInternalRef,
} from "../../types/piece";
import BoardRuntime from "../BoardRuntime/BoardRuntime";
import { IRenderer2D } from "./interface";
import { TEvents } from "../../types/events";

class Renderer2D implements IRenderer2D {
  protected staticPieces: Record<TPieceId, TPieceInternalRef> = {} as Record<
    TPieceId,
    TPieceInternalRef
  >;

  protected dynamicPieces: Record<TPieceId, TPieceInternalRef> = {} as Record<
    TPieceId,
    TPieceInternalRef
  >;

  private coordsMap: Record<TCanvasLayer, Map<TPieceId, TPieceCoords>> = {
    board: new Map(),
    staticPieces: new Map(),
    dynamicPieces: new Map(),
    overlay: new Map(),
    underlay: new Map(),
  };
  private renderMap: Record<TCanvasLayer, Map<TPieceId, TRender>> = {
    board: new Map(),
    staticPieces: new Map(),
    dynamicPieces: new Map(),
    overlay: new Map(),
    underlay: new Map(),
  };
  private clearMap: Record<TCanvasLayer, TCanvasCoords[]> = {
    board: [],
    staticPieces: [],
    dynamicPieces: [],
    overlay: [],
    underlay: [],
  };

  private animationMap: Record<
    string,
    { canvas: TCanvasLayer; coords: TCanvasCoords }[]
  > = {};

  private eventsMap: Record<
    TEvents,
    { canvas: TCanvasLayer; coords: TCanvasCoords }[]
  > = {} as Record<TEvents, { canvas: TCanvasLayer; coords: TCanvasCoords }[]>;

  constructor(protected boardRuntime: BoardRuntime) {}

  destroy(): void {
    for (const key of Object.getOwnPropertyNames(this)) {
      (this as any)[key] = null;
    }
  }

  renderDynamicPieces(): void {
    const boardRuntime = this.boardRuntime,
      canvasLayers = boardRuntime.getCanvasLayers(),
      animation = boardRuntime.getAnimation(),
      animationRef = boardRuntime.getAnimationRef();
    const canvas = canvasLayers.getCanvas("dynamicPieces").current;
    if (canvas === null) return;

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

  renderStaticPieces(): void {
    const boardRuntime = this.boardRuntime,
      canvasLayers = boardRuntime.getCanvasLayers();
    const canvas = canvasLayers.getCanvas("staticPieces").current;
    if (canvas === null) return;

    boardRuntime.draw.pieces("static");
  }
  renderUnderlay(): void {
    const boardRuntime = this.boardRuntime,
      canvasLayers = boardRuntime.getCanvasLayers();
    const canvas = canvasLayers.getCanvas("underlay").current;
    if (!canvas === null) return;
    boardRuntime.draw.underlay();
  }

  renderOverlay(): void {
    const boardRuntime = this.boardRuntime,
      canvasLayers = boardRuntime.getCanvasLayers();
    const canvas = canvasLayers.getCanvas("overlay").current;
    if (!canvas === null) return;

    boardRuntime.draw.overlay();
  }

  renderClientOverlayEvents() {
    this.boardRuntime.draw.clientOverlayEvents();
  }

  renderBoard(): void {
    const boardRuntime = this.boardRuntime,
      canvasLayers = boardRuntime.getCanvasLayers();
    if (!canvasLayers) return;
    const canvas = canvasLayers.getCanvas("board").current;
    if (!canvas) return;

    boardRuntime.draw.board();
  }

  addStaticPiece(id: TPieceId, piece: TPieceInternalRef) {
    piece && this.addPosition(id, { x: piece.x, y: piece.y }, "staticPieces");
    if (!piece || this.staticPieces[id]) return;
    this.renderMap.staticPieces.set(id, {
      piece,
      x: piece.x,
      y: piece.y,
    });
    this.staticPieces[id] = piece;
  }

  addDynamicPiece(id: TPieceId, piece: TPieceInternalRef) {
    piece && this.addPosition(id, { x: piece.x, y: piece.y }, "dynamicPieces");
    if (!piece || this.dynamicPieces[id]) return;
    this.renderMap.dynamicPieces.set(id, {
      piece,
      x: piece.x,
      y: piece.y,
    });
    this.dynamicPieces[id] = piece;
  }

  addPosition(id: TPieceId, coords: TPieceCoords, canvas: TCanvasLayer) {
    this.coordsMap[canvas].set(id, coords);
  }

  addToClear(coords: TCanvasCoords, canvas: TCanvasLayer) {
    this.clearMap[canvas].push(coords);
  }

  addEvent(
    key: TEvents,
    opts: { canvas: TCanvasLayer; coords: TCanvasCoords }
  ) {
    if (!this.eventsMap[key]) this.eventsMap[key] = [];
    this.eventsMap[key].push(opts);
  }

  addAnimation(
    key: string,
    opts: { canvas: TCanvasLayer; coords: TCanvasCoords }
  ) {
    if (!this.animationMap[key]) this.animationMap[key] = [];
    this.animationMap[key].push(opts);
  }

  clearEvent(key: TEvents) {
    const curr = this.eventsMap[key];
    if (!curr) return;

    for (const obj of curr) this.addToClear(obj.coords, obj.canvas);
    delete this.eventsMap[key];
  }

  clearAnimation(key: string) {
    const curr = this.animationMap[key];
    if (!curr) return;

    for (const obj of curr) this.addToClear(obj.coords, obj.canvas);
    delete this.animationMap[key];
  }

  deleteStaticPosition(id: TPieceId) {
    this.coordsMap.staticPieces.delete(id);
  }

  deleteDynamicPosition(id: TPieceId) {
    this.coordsMap.dynamicPieces.delete(id);
  }

  getPosition(id: TPieceId, canvas: TCanvasLayer) {
    return Utils.deepFreeze(this.coordsMap[canvas].get(id));
  }

  getAllDynamicCoords() {
    return Utils.deepFreeze(this.coordsMap.dynamicPieces.entries());
  }

  getAllStaticCoords() {
    return Utils.deepFreeze(this.coordsMap.staticPieces.entries());
  }

  getToClear(canvas: TCanvasLayer) {
    return this.clearMap[canvas];
  }

  deleteStaticPiece(id: TPieceId) {
    const piece = this.staticPieces[id];
    const squareSize = this.boardRuntime.getSize() / 8;
    if (!piece) return;
    this.addToClear(
      {
        x: piece.x,
        y: piece.y,
        w: squareSize,
        h: squareSize,
      },
      "staticPieces"
    );
    this.deleteStaticPosition(id);
    this.renderMap.staticPieces.delete(id);
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
      this.addToClear(
        {
          x: piece.x,
          y: piece.y,
          w: squareSize,
          h: squareSize,
        },
        "staticPieces"
      );

    for (const obj of clear)
      this.addToClear(
        {
          x: obj.piece.x,
          y: obj.piece.y,
          w: squareSize,
          h: squareSize,
        },
        "staticPieces"
      );

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
    this.renderMap.staticPieces.clear();
    this.coordsMap.staticPieces.clear();
    this.coordsMap.dynamicPieces.clear();
  }

  resetToClear(canvas: TCanvasLayer) {
    this.clearMap[canvas] = [];
  }

  deleteDynamicPiece(id: TPieceId) {
    const piece = this.dynamicPieces[id];
    const squareSize = this.boardRuntime.getSize() / 8;
    if (!piece) return;
    this.addToClear(
      {
        x: piece.x,
        y: piece.y,
        w: squareSize,
        h: squareSize,
      },
      "dynamicPieces"
    );
    this.deleteDynamicPosition(id);
    this.renderMap.dynamicPieces.delete(id);
    delete this.dynamicPieces[id];
  }

  clearStaticToRender() {
    this.renderMap.staticPieces.clear();
  }

  getDynamicPieceObj() {
    return this.dynamicPieces;
  }

  getStaticPieceObj() {
    return this.staticPieces;
  }

  getToRender(canvas: TCanvasLayer) {
    return this.renderMap[canvas];
  }

  clear(): void {
    throw new Error("Method not implemented.");
  }
}

export default Renderer2D;
