import {
  TAnimation,
  TBaseCtx,
  TCanvasCoords,
  TCanvasLayer,
  TEvents,
  TPieceBoard,
  TPieceId,
  TPieceInternalRef,
} from "types";
import { ICanvasLayer } from "./interface";
import BoardRuntime from "../boardRuntime/boardRuntime";
import SpatialIndex from "./spatialIndex";
import SpatialNode from "./spatialNode";

abstract class BaseLayer implements ICanvasLayer {
  name: TCanvasLayer;
  protected boardRuntime: BoardRuntime;
  protected pieces = new Map<TPieceId, TPieceInternalRef>();
  protected coordsMap = new Map<TPieceId, TCanvasCoords>();
  protected clearMap = new Map<TPieceId, TCanvasCoords>();
  protected renderMap = new Set<TPieceId>();
  protected clearQueue: TCanvasCoords[] = [];
  protected eventsMap: Record<TEvents, TCanvasCoords[]> = {} as Record<
    TEvents,
    TCanvasCoords[]
  >;
  protected pendingResolvers: Map<number, () => void> = new Map();
  protected animationGen = 0;
  protected animationRef: number | null = null;
  protected animation: TAnimation[] = [];
  protected ctx: TBaseCtx | null = null;

  protected delayedPieceClear: Map<TPieceId, TPieceId> = new Map();
  private destroyed = false;
  spatialIndex: SpatialIndex;

  constructor(name: TCanvasLayer, boardRuntime: BoardRuntime) {
    this.name = name;
    this.boardRuntime = boardRuntime;
    this.ctx = boardRuntime.getCanvasLayers().getContext(name);
    const size = this.boardRuntime.getSize();
    this.spatialIndex = new SpatialIndex({ x: 0, y: 0, w: size, h: size });
  }

  destroy() {
    this.clearAnimation();
    for (const key of Object.getOwnPropertyNames(this)) {
      (this as any)[key] = null;
    }
    this.destroyed = true;
  }

  update(delta: number): void {
    throw new Error("Method not implemented.");
  }

  clearPieces?(board: TPieceBoard[]): void {
    throw new Error("Method not implemented.");
  }
  clear(): void {
    const canvasLayers = this.boardRuntime.getCanvasLayers();
    const dpr = canvasLayers.getDpr();

    for (const c of this.clearQueue) {
      this.ctx?.save();
      this.ctx?.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx?.clearRect(c.x * dpr, c.y * dpr, c.w * dpr, c.h * dpr);
      this.ctx?.restore();
    }
    this.resetClearQueue();
  }

  draw(): void {
    throw new Error("Method not implemented.");
  }
  addPiece?(pieceId: TPieceId, ref: TPieceInternalRef): void {
    this.pieces.set(pieceId, ref);
  }
  removePiece?(pieceId: TPieceId): void {
    this.pieces.delete(pieceId);
    this.spatialIndex.remove(pieceId);
  }
  addAll?(
    pieceId: TPieceId,
    ref: TPieceInternalRef,
    coords: TCanvasCoords,
    clearCoords: TCanvasCoords
  ) {
    this.addCoords(pieceId, coords);
    this.addPiece?.(pieceId, ref);
    this.addClearCoords(pieceId, clearCoords);
    this.addToRender(pieceId);
  }
  removeAll?(pieceId: TPieceId) {
    const coords = this.getClearCoords(pieceId);
    coords && this.addClearQueue(coords);

    this.removePiece?.(pieceId);
    this.removeToRender(pieceId);
    this.removeCoords(pieceId);
    this.removeClearCoords(pieceId);
  }

  handleEvent?(event: TEvents, coords: TCanvasCoords): void {
    if (!this.eventsMap[event]) this.eventsMap[event] = [];
    this.eventsMap[event].push(coords);
  }

  addCoords(pieceId: TPieceId, coords: TCanvasCoords) {
    if (!this.spatialIndex.update(pieceId, coords))
      this.spatialIndex.insert(new SpatialNode(pieceId, coords));
    this.coordsMap.set(pieceId, { ...coords, id: pieceId });
  }

  removeCoords(pieceId: TPieceId) {
    this.coordsMap.delete(pieceId);
  }

  addClearCoords(pieceId: TPieceId, coords: TCanvasCoords) {
    this.clearMap.set(pieceId, { ...coords, id: pieceId });
  }

  removeClearCoords(pieceId: TPieceId) {
    this.clearMap.delete(pieceId);
  }

  addToRender(pieceId: TPieceId) {
    this.renderMap.add(pieceId);
  }

  removeToRender(pieceId: TPieceId) {
    this.renderMap.delete(pieceId);
  }

  addClearQueue(coords: TCanvasCoords) {
    this.clearQueue.push(coords);
  }

  resetClearQueue() {
    this.clearQueue = [];
  }

  addEvent(event: TEvents, coords: TCanvasCoords[] | TCanvasCoords) {
    if (!this.eventsMap[event]) this.eventsMap[event] = [];
    coords = Array.isArray(coords) ? coords : [coords];
    this.eventsMap[event].push(...coords);
  }

  removeEvent(event: TEvents) {
    const hasEvent = this.eventsMap[event];

    if (!hasEvent) return;
    const regions: TCanvasCoords[] = [];
    for (const e of hasEvent) {
      this.addClearQueue(e);
      regions.push(e);
    }
    delete this.eventsMap[event];
    const layerManager = this.boardRuntime.renderer.getLayerManager();
    for (const [e, coords] of Object.entries(this.eventsMap)) {
      for (const c of coords) {
        for (const r of regions) {
          if (this.intersects(c, r)) {
            layerManager.addDraw(e as TEvents);
            layerManager.removeEvent(e as TEvents);
            break;
          }
        }
      }
    }
  }

  intersects(a: TCanvasCoords, b: TCanvasCoords) {
    return !(
      a.x + a.w <= b.x ||
      b.x + b.w <= a.x ||
      a.y + a.h <= b.y ||
      b.y + b.h <= a.y
    );
  }

  pieceIntersects(a: TCanvasCoords, b: TCanvasCoords) {
    const left = Math.max(a.x, b.x);
    const right = Math.min(a.x + a.w, b.x + b.w);
    const top = Math.max(a.y, b.y);
    const bottom = Math.min(a.y + a.h, b.y + b.h);

    const overlapW = right - left;
    const overlapH = bottom - top;

    if (overlapW <= 0 || overlapH <= 0) return false;
    return overlapW >= 2 && overlapH >= 2;
  }

  getCtx() {
    return this.ctx;
  }

  hasPiece(pieceId: TPieceId) {
    return this.pieces.has(pieceId);
  }

  getPiece(pieceId: TPieceId) {
    return this.pieces.get(pieceId);
  }

  getCoords(pieceId: TPieceId) {
    return this.coordsMap.get(pieceId);
  }

  getClearCoords(pieceId: TPieceId) {
    return this.clearMap.get(pieceId);
  }

  getToRender() {
    return Array.from(this.renderMap.keys());
  }

  clearRenderMap() {
    this.renderMap.clear();
  }

  resetLayer() {
    const size = this.boardRuntime.getSize();
    this.pieces.clear();
    this.coordsMap.clear();
    this.renderMap.clear();
    this.clearMap.clear();
    this.spatialIndex.destroy();
    this.spatialIndex = new SpatialIndex({
      x: 0,
      y: 0,
      w: size,
      h: size,
    });
    this.clearQueue.length = 0;
    this.eventsMap = {} as Record<TEvents, TCanvasCoords[]>;
  }

  updateClear(): void {
    return;
  }

  postRender?(): void {
    return;
  }

  setAnimationRef(ref: number | null) {
    this.animationRef = ref;
  }

  clearAnimation() {
    if (this.animationRef) {
      cancelAnimationFrame(this.animationRef);
      this.setAnimationRef(null);
    }

    this.incrementAnimationGen();

    if (this.pendingResolvers.size > 0) {
      for (const [, resolver] of this.pendingResolvers) {
        try {
          resolver();
        } catch (e) {
          /* swallow */
        }
      }
      this.pendingResolvers.clear();
    }
  }

  setPendingResolvers(key: number, resolver: () => void) {
    this.pendingResolvers.set(key, resolver);
  }

  getPendingResolvers() {
    return this.pendingResolvers;
  }

  getAnimationGen() {
    return this.animationGen;
  }

  setResolverGen(n: number) {
    this.animationGen = n;
  }

  incrementAnimationGen() {
    this.animationGen++;
  }

  getAnimation() {
    return this.animation;
  }

  getAnimationRef() {
    return this.animationRef;
  }

  addAnimation(anim: TAnimation) {
    this.animation.push(anim);
  }

  updateAnimation() {
    this.animation = this.animation.filter((anim) => anim.piece.anim);
    this.animation.length <= 0 && this.boardRuntime.setIsMoving(false);
  }

  getEvents(event?: TEvents) {
    if (event) return this.eventsMap[event];
    return this.eventsMap;
  }

  drawEvent(fun: (ctx: TBaseCtx) => void, event: TEvents) {
    if (!this.ctx) return;
    fun(this.ctx);
    this.boardRuntime.renderer
      .getLayerManager()
      .applyDrawResult(this.ctx, this.name, event);
  }

  render(delta: number) {
    this.updateClear();
    this.update?.(delta);
    this.clear();
    this.draw();
    this.postRender?.();
  }
}

export default BaseLayer;
