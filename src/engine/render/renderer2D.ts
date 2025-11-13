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

  private coordsMap: Record<TCanvasLayer, Map<TPieceId, TPieceCoords>> = {
    board: new Map(),
    pieces: new Map(),
    dynamicPieces: new Map(),
    overlay: new Map(),
    overlayUp: new Map(),
  };
  private renderMap: Record<TCanvasLayer, Map<TPieceId, TRender>> = {
    board: new Map(),
    pieces: new Map(),
    dynamicPieces: new Map(),
    overlay: new Map(),
    overlayUp: new Map(),
  };
  private clearMap: Record<TCanvasLayer, TCanvasCoords[]> = {
    board: [],
    pieces: [],
    dynamicPieces: [],
    overlay: [],
    overlayUp: [],
  };

  private animationMap: Record<
    string,
    { canvas: TCanvasLayer; coords: TCanvasCoords[] }
  > = {};

  private eventsMap: Record<
    string,
    { canvas: TCanvasLayer; coords: TCanvasCoords[] }
  > = {};

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
    boardRuntime.draw.downOverlay();
  }

  renderUpOverlay(): void {
    const boardRuntime = this.boardRuntime,
      canvasLayers = boardRuntime.getCanvasLayers();
    const canvas = canvasLayers.getCanvas("overlayUp").current;
    if (!canvas === null) return;
    canvasLayers.keepQuality("overlayUp", boardRuntime.getSize());

    boardRuntime.draw.upOverlay();
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
    piece && this.addPosition(id, { x: piece.x, y: piece.y }, "pieces");
    if (!piece) return;
    this.renderMap.pieces.set(id, {
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
    key: string,
    opts: { canvas: TCanvasLayer; coords: TCanvasCoords[] }
  ) {
    if (!this.eventsMap[key]) this.eventsMap[key] = opts;
    else this.eventsMap[key].coords.push(...opts.coords);
  }

  addAnimation(
    key: string,
    opts: { canvas: TCanvasLayer; coords: TCanvasCoords[] }
  ) {
    if (!this.animationMap[key]) this.animationMap[key] = opts;
    else this.animationMap[key].coords.push(...opts.coords);
  }

  clearEvent(key: string) {
    const curr = this.eventsMap[key];
    if (!curr) return;

    for (const coords of curr.coords) this.addToClear(coords, curr.canvas);
    delete this.eventsMap[key];
  }

  clearAnimation(key: string) {
    const curr = this.animationMap[key];
    if (!curr) return;

    for (const coords of curr.coords) this.addToClear(coords, curr.canvas);
    delete this.animationMap[key];
  }

  deleteStaticPosition(id: TPieceId) {
    this.coordsMap.pieces.delete(id);
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
    return Utils.deepFreeze(this.coordsMap.pieces.entries());
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
      "pieces"
    );
    this.deleteStaticPosition(id);
    this.renderMap.pieces.delete(id);
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
        "pieces"
      );

    for (const obj of clear)
      this.addToClear(
        {
          x: obj.piece.x,
          y: obj.piece.y,
          w: squareSize,
          h: squareSize,
        },
        "pieces"
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
    this.renderMap.pieces.clear();
    this.coordsMap.pieces.clear();
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
    this.renderMap.pieces.clear();
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
