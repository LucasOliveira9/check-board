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
import LayerManager from "../layers/layerManager";

class Renderer2D implements IRenderer2D {
  private layerManager: LayerManager;

  constructor(protected boardRuntime: BoardRuntime) {
    this.layerManager = new LayerManager(boardRuntime);
  }
  renderClientOverlayEvents(): void {
    return;
  }
  getLayerManager(): LayerManager {
    return this.layerManager;
  }
  clearRect(coords: TCanvasCoords, canvas: TCanvasLayer): void {
    throw new Error("Method not implemented.");
  }
  clearStaticToRender(): void {
    throw new Error("Method not implemented.");
  }
  resetStaticPieces(): void {
    throw new Error("Method not implemented.");
  }
  getToRender(canvas: TCanvasLayer): Map<TPieceId, TRender> {
    throw new Error("Method not implemented.");
  }
  getPosition(
    id: TPieceId,
    canvas: TCanvasLayer
  ): { readonly x: number; readonly y: number } | undefined {
    throw new Error("Method not implemented.");
  }
  clearStaticPieces(board: TPieceBoard[]): void {
    throw new Error("Method not implemented.");
  }
  getToClear(canvas: TCanvasLayer): TCanvasCoords[] {
    throw new Error("Method not implemented.");
  }
  resetToClear(canvas: TCanvasLayer): void {
    throw new Error("Method not implemented.");
  }
  deleteStaticPiece(id: TPieceId): void {
    throw new Error("Method not implemented.");
  }
  getDynamicPieceObj(): Record<TPieceId, TPieceInternalRef> {
    throw new Error("Method not implemented.");
  }
  getStaticPieceObj(): Record<TPieceId, TPieceInternalRef> {
    throw new Error("Method not implemented.");
  }

  destroy(): void {
    for (const key of Object.getOwnPropertyNames(this)) {
      (this as any)[key] = null;
    }
  }

  async renderDynamicPieces() {
    const boardRuntime = this.boardRuntime;
    const canvasLayers = boardRuntime.getCanvasLayers();
    const canvas = canvasLayers.getCanvas("dynamicPieces").current;
    const ctx = canvasLayers.getContext("dynamicPieces");

    if (!canvas || !ctx) return;
    const layer = this.layerManager.getLayer("dynamicPieces");
    const animation = layer.getAnimation();

    if (animation.length === 0) {
      layer.clearAnimation();
      layer.render(ctx, 0);
      //boardRuntime.draw.pieces("dynamic");
      return;
    }

    layer.incrementAnimationGen();
    const gen = layer.getAnimationGen();

    return new Promise<void>((resolve) => {
      let resolved = false;
      const resolver = () => {
        if (resolved) return;

        layer.getPendingResolvers().delete(gen);
        try {
          resolve();
        } catch (e) {
          /* swallow */
        }
      };

      layer.setPendingResolvers(gen, resolver);

      const render = (time: number) => {
        if (gen !== layer.getAnimationGen()) return;

        const animation = layer.getAnimation();

        if (animation.length === 0) {
          resolver();
          layer.setAnimationRef(null);
          return;
        }

        layer.render(ctx, time);
        //boardRuntime.draw.pieces("dynamic", time);
        const nextRef = requestAnimationFrame(render);
        layer.setAnimationRef(nextRef);
      };
      const firstRef = requestAnimationFrame(render);
      layer.setAnimationRef(firstRef);
    });
  }

  renderStaticPieces(): void {
    const boardRuntime = this.boardRuntime,
      canvasLayers = boardRuntime.getCanvasLayers();
    const canvas = canvasLayers.getCanvas("staticPieces").current;
    const ctx = canvasLayers.getContext("staticPieces");
    if (canvas === null || !ctx) return;
    const layer = this.layerManager.getLayer("staticPieces");
    layer.render(ctx, 0);
  }
  renderUnderlay(): void {
    const boardRuntime = this.boardRuntime,
      canvasLayers = boardRuntime.getCanvasLayers();
    const ctx = canvasLayers.getContext("underlay");
    const canvas = canvasLayers.getCanvas("underlay").current;
    if (!canvas === null || !ctx) return;
    const layer = this.layerManager.getLayer("underlay");
    layer.render(ctx, 0);
  }

  renderOverlay(): void {
    const boardRuntime = this.boardRuntime,
      canvasLayers = boardRuntime.getCanvasLayers();
    const canvas = canvasLayers.getCanvas("overlay").current;
    const ctx = canvasLayers.getContext("overlay");
    if (!canvas === null || !ctx) return;
    const layer = this.layerManager.getLayer("overlay");
    layer.render(ctx, 0);
  }

  /* renderClientOverlayEvents() {
    this.boardRuntime.draw.clientOverlayEvents();
  }*/

  renderBoard(): void {
    const boardRuntime = this.boardRuntime,
      canvasLayers = boardRuntime.getCanvasLayers();
    if (!canvasLayers) return;
    const canvas = canvasLayers.getCanvas("board").current;
    const ctx = canvasLayers.getContext("board");
    if (!canvas === null || !ctx) return;
    const layer = this.layerManager.getLayer("board");
    layer.render(ctx, 0);
  }

  addStaticPiece(id: TPieceId, piece: TPieceInternalRef) {
    /*piece && this.addPosition(id, { x: piece.x, y: piece.y }, "staticPieces");
    if (!piece || this.layerManager.getLayer("staticPieces").hasPiece(id))
      return;
    this.renderMap.staticPieces.set(id, {
      piece,
      x: piece.x,
      y: piece.y,
    });
    this.layerManager.getLayer("staticPieces").addPiece(id, piece);*/
  }

  addDynamicPiece(id: TPieceId, piece: TPieceInternalRef) {
    /* piece && this.addPosition(id, { x: piece.x, y: piece.y }, "dynamicPieces");
    if (!piece || this.layerManager.getLayer("dynamicPieces").hasPiece(id))
      return;
    this.renderMap.dynamicPieces.set(id, {
      piece,
      x: piece.x,
      y: piece.y,
    });
    this.layerManager.getLayer("dynamicPieces").addPiece(id, piece);*/
  }

  addPosition(id: TPieceId, coords: TPieceCoords, canvas: TCanvasLayer) {
    //this.coordsMap[canvas].set(id, coords);
  }

  addToClear(coords: TCanvasCoords, canvas: TCanvasLayer) {
    this.layerManager.getLayer(canvas).addClearCoords(coords);
  }

  addEvent(
    key: TEvents,
    opts: { canvas: TCanvasLayer; coords: TCanvasCoords }
  ) {
    /* if (!this.eventsMap[key]) this.eventsMap[key] = [];
    this.eventsMap[key].push(opts);*/
  }

  addAnimation(
    key: string,
    opts: { canvas: TCanvasLayer; coords: TCanvasCoords }
  ) {
    /*if (!this.animationMap[key]) this.animationMap[key] = [];
    this.animationMap[key].push(opts);*/
  }

  clearEvent(key: TEvents) {
    /*const curr = this.eventsMap[key];
    if (!curr) return;

    for (const obj of curr) this.addToClear(obj.coords, obj.canvas);
    delete this.eventsMap[key];*/
  }

  clearAnimation(key: string) {
    /*const curr = this.animationMap[key];
    if (!curr) return;

    for (const obj of curr) this.addToClear(obj.coords, obj.canvas);
    delete this.animationMap[key];*/
  }

  deleteStaticPosition(id: TPieceId) {
    throw new Error("Method not implemented.");
  }

  deleteDynamicPosition(id: TPieceId) {
    throw new Error("Method not implemented.");
  }

  deleteDynamicPiece(id: TPieceId) {
    /*const piece = this.dynamicPieces[id];
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
    delete this.dynamicPieces[id];*/
  }

  clear(): void {
    throw new Error("Method not implemented.");
  }
}

export default Renderer2D;
