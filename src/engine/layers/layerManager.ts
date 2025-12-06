import {
  TBaseCtx,
  TBoardEventContext,
  TCanvasCoords,
  TCanvasLayer,
  TDrawRegion,
  TEvents,
  TGetterBoardEventContext,
  TPieceId,
  TSafeCtx,
} from "types";
import { EVENTS } from "../../types/events";
import BaseLayer from "./baseLayer";
import BoardLayer from "./boardLayer";
import BoardRuntime from "engine/BoardRuntime/BoardRuntime";
import UnderlayLayer from "./underlayLayer";
import StaticPiecesLayer from "./staticPieces";
import DynamicPiecesLayer from "./dynamicPiecesLayer";
import OverlayLayer from "./overlayLayer";
import Iterators from "../iterators/iterators";
import Events from "./events";

class LayerManager {
  private layers: Record<TCanvasLayer, BaseLayer>;
  private iterator: Iterators;
  private events: Events;
  private interaction: Record<TEvents, boolean> = {
    onPointerSelect: true,
    onPointerHover: true,
    onPointerDragStart: true,
    onPointerDrag: true,
    onPointerDrop: true,
    onAnimationFrame: true,
    onDrawPiece: true,
    onDrawBoard: true,
    onDrawOverlay: true,
    onDrawUnderlay: true,
  };
  private boardRuntime: BoardRuntime;
  private drawList: Set<TEvents> = new Set();
  private firstDrawList: Set<TEvents> = new Set();
  private list: Record<TEvents, Set<TEvents>> = {
    onPointerSelect: this.drawList,
    onPointerHover: this.drawList,
    onPointerDragStart: this.firstDrawList,
    onPointerDrag: this.firstDrawList,
    onPointerDrop: this.drawList,
    onAnimationFrame: this.drawList,
    onDrawPiece: this.drawList,
    onDrawBoard: this.drawList,
    onDrawOverlay: this.drawList,
    onDrawUnderlay: this.drawList,
  };
  private delayedPieceClear: Map<TPieceId, TPieceId> = new Map();

  constructor(boardRuntime: BoardRuntime) {
    this.boardRuntime = boardRuntime;
    this.layers = {
      board: new BoardLayer(boardRuntime),
      overlay: new OverlayLayer(boardRuntime),
      underlay: new UnderlayLayer(boardRuntime),
      staticPieces: new StaticPiecesLayer(boardRuntime),
      dynamicPieces: new DynamicPiecesLayer(boardRuntime),
    };

    this.iterator = new Iterators(boardRuntime);
    this.events = new Events(boardRuntime);
  }

  getLayer(layer: TCanvasLayer) {
    return this.layers[layer];
  }

  getAllLayers() {
    return Object.keys(this.layers);
  }

  getIterator() {
    return this.iterator;
  }

  getPieceLayer(pieceId: TPieceId) {
    for (const [name, layer] of Object.entries(this.layers))
      if (layer.hasPiece(pieceId)) return name as TCanvasLayer;
    return null;
  }

  removeFromAllLayers(pieceId: TPieceId) {
    for (const layer of Object.values(this.layers)) layer.removeAll?.(pieceId);
  }

  removeEvent(event: TEvents) {
    for (const layer of Object.values(this.layers)) layer.removeEvent(event);
  }

  async togglePieceLayer(
    from: TCanvasLayer,
    to: TCanvasLayer,
    pieceId: TPieceId,
    noRender?: boolean
  ) {
    if (from === to) return;

    const fromLayer = this.getLayer(from);
    const toLayer = this.getLayer(to);
    const squareSize = this.boardRuntime.getSize() / 8;

    if (!fromLayer || !toLayer) {
      //console.warn("[togglePieceLayer] Invalid Layer:", from, to);
      return;
    }

    const piece = fromLayer.getPiece(pieceId);
    const coords = fromLayer.getCoords(pieceId);

    if (!piece || !coords) {
      /*console.warn(`[togglePieceLayer] Incomplete state for piece ${pieceId}`, {
        from,
        piece,
        coords,
      });*/
      return;
    }

    const newCoords: TCanvasCoords = {
      x: piece.x,
      y: piece.y,
      w: squareSize,
      h: squareSize,
    };

    fromLayer.removeAll?.(pieceId);
    toLayer.addAll?.(pieceId, piece, newCoords);
    if (noRender) return;
    this.boardRuntime.pipelineRender.setNextEvent("onRender", [false]);
  }

  applyDrawResult(
    ctx_:
      | (TSafeCtx & {
          __drawRegions: TDrawRegion[];
          __clearRegions: () => void;
        })
      | TBaseCtx,
    layer: TCanvasLayer,
    event?: TEvents,
    record?: TPieceId
  ) {
    const regions = ctx_.__drawRegions;
    if (!regions.length) return;

    for (const coords of regions) {
      const coords_ = {
        x: Math.floor(coords.x),
        y: Math.floor(coords.y),
        w: Math.ceil(coords.w),
        h: Math.ceil(coords.h),
      };
      if (record) {
        this.getLayer(layer).addCoords(record, coords_);
      }
      if (event) this.getLayer(layer).addEvent(event, coords_);
    }

    ctx_.__clearRegions();
  }

  drawEvent(event: TEvents) {
    this.removeEvent(event);
    this.addDraw(event);
  }

  addDraw(event: TEvents) {
    this.list[event].add(event);
  }

  removeDraw(event: TEvents) {
    this.list[event].delete(event);
  }

  getEventEnabled() {
    return this.interaction;
  }

  isSelectionEnabled() {
    return this.interaction.onPointerSelect;
  }

  isHoverEnabled() {
    return this.interaction.onPointerHover;
  }

  setHoverEnabled(b: boolean) {
    return (this.interaction.onPointerHover = b);
  }

  setSelectionEnabled(b: boolean) {
    return (this.interaction.onPointerSelect = b);
  }

  resetAllLayers() {
    for (const layer of Object.values(this.layers)) layer.resetLayer();
  }

  renderEvents(first: boolean) {
    const list = first ? this.firstDrawList.values() : this.drawList.values();
    for (const event of list) {
      this.interaction[event] = true;
      this.events.run(event);
      this.interaction[event] = false;
    }
    first ? this.firstDrawList.clear() : this.drawList.clear();
  }

  addDelayedPieceClear(owner: TPieceId, target: TPieceId) {
    this.delayedPieceClear.set(owner, target);
  }

  getDelayedPieceClear(pieceId: TPieceId) {
    return this.delayedPieceClear.get(pieceId);
  }

  deleteDelayedPieceClear(pieceId: TPieceId) {
    this.delayedPieceClear.delete(pieceId);
  }

  resetDelayedPieceClear() {
    this.delayedPieceClear.clear();
  }

  isDelayedPieceClear(pieceId: TPieceId) {
    return Array.from(this.delayedPieceClear.values()).includes(pieceId);
  }

  clearDelayedPiece(pieceId: TPieceId, layer: TCanvasLayer) {
    const delayed = this.getDelayedPieceClear(pieceId);
    if (delayed) {
      const layer_ = this.getLayer(layer);
      const coords = layer_.getCoords(delayed);
      if (coords) {
        layer_.addClearQueue(coords);
        layer_.removeAll?.(delayed);
        layer_.clear();
      }

      this.deleteDelayedPieceClear(pieceId);
    }
  }
}

export default LayerManager;
