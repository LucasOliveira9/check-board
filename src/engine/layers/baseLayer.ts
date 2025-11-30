import {
  TAnimation,
  TCanvasCoords,
  TCanvasLayer,
  TDrawRegion,
  TEvents,
  TPieceBoard,
  TPieceCoords,
  TPieceId,
  TPieceInternalRef,
  TRender,
} from "types";
import { ICanvasLayer } from "./interface";
import BoardRuntime from "../BoardRuntime/BoardRuntime";

abstract class BaseLayer implements ICanvasLayer {
  name: TCanvasLayer;
  protected boardRuntime: BoardRuntime;
  protected pieces = new Map<TPieceId, TPieceInternalRef>();
  protected coordsMap = new Map<TPieceId, TCanvasCoords>();
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
  protected ctx:
    | (CanvasRenderingContext2D & {
        __drawRegions: TDrawRegion[];
        __clearRegions: () => void;
      })
    | null = null;

  private destroyed = false;

  constructor(name: TCanvasLayer, boardRuntime: BoardRuntime) {
    this.name = name;
    this.boardRuntime = boardRuntime;
    this.ctx = boardRuntime.getCanvasLayers().getContext(name);
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
    this.clearQueue.length = 0;
  }
  draw(): void {
    throw new Error("Method not implemented.");
  }
  addPiece?(pieceId: TPieceId, ref: TPieceInternalRef): void {
    this.pieces.set(pieceId, ref);
  }
  removePiece?(pieceId: TPieceId): void {
    this.pieces.delete(pieceId);
  }
  addAll?(pieceId: TPieceId, ref: TPieceInternalRef, coords: TCanvasCoords) {
    this.pieces.set(pieceId, ref);
    this.coordsMap.set(pieceId, coords);
    this.renderMap.add(pieceId);
  }
  removeAll?(pieceId: TPieceId) {
    const coords = this.getCoords(pieceId);
    coords && this.addClearCoords(coords);

    this.pieces.delete(pieceId);
    this.coordsMap.delete(pieceId);
    this.renderMap.delete(pieceId);
  }
  handleEvent?(event: TEvents, coords: TCanvasCoords): void {
    if (!this.eventsMap[event]) this.eventsMap[event] = [];
    this.eventsMap[event].push(coords);
  }
  addCoords(pieceId: TPieceId, coords: TCanvasCoords) {
    this.coordsMap.set(pieceId, coords);
  }

  removeCoords(pieceId: TPieceId) {
    this.coordsMap.delete(pieceId);
  }

  addToRender(pieceId: TPieceId) {
    this.renderMap.add(pieceId);
  }

  removeToRender(pieceId: TPieceId) {
    this.renderMap.delete(pieceId);
  }

  addClearCoords(coords: TCanvasCoords) {
    this.clearQueue.push(coords);
  }

  resetClearCoords() {
    this.clearQueue.length = 0;
  }

  addEvent(event: TEvents, coords: TCanvasCoords[] | TCanvasCoords) {
    if (!this.eventsMap[event]) this.eventsMap[event] = [];
    coords = Array.isArray(coords) ? coords : [coords];
    this.eventsMap[event].push(...coords);
  }

  removeEvent(event: TEvents, forceClear?: boolean) {
    const hasEvent = this.eventsMap[event];
    if (!hasEvent) return;
    for (const e of hasEvent) this.addClearCoords(e);
    delete this.eventsMap[event];
    forceClear && this.clear();
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

  getToRender() {
    return Array.from(this.renderMap.keys());
  }

  clearRenderMap() {
    this.renderMap.clear();
  }

  resetLayer() {
    this.pieces.clear();
    this.coordsMap.clear();
    this.renderMap.clear();
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

  render(
    ctx: CanvasRenderingContext2D & {
      __drawRegions: TDrawRegion[];
      __clearRegions: () => void;
    },
    delta: number
  ) {
    this.updateClear();
    this.update?.(delta);
    this.clear();
    this.draw();
    this.postRender?.();
  }
}

export default BaseLayer;
