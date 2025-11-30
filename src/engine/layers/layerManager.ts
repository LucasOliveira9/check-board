import {
  TCanvasCoords,
  TCanvasLayer,
  TDrawRegion,
  TEvents,
  TPieceId,
  TSafeCtx,
} from "types";
import BaseLayer from "./baseLayer";
import BoardLayer from "./boardLayer";
import BoardRuntime from "engine/BoardRuntime/BoardRuntime";
import UnderlayLayer from "./underlayLayer";
import StaticPiecesLayer from "./staticPieces";
import DynamicPiecesLayer from "./dynamicPiecesLayer";
import OverlayLayer from "./overlayLayer";
import Iterators from "../iterators/iterators";

class LayerManager {
  private layers: Record<TCanvasLayer, BaseLayer>;
  private iterator: Iterators;
  private interaction = {
    hover: true,
    selection: true,
    dragging: true,
    highlight: true,
    animation: true,
  };
  private boardRuntime: BoardRuntime;

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

  removeEvent(event: TEvents, forceClear?: boolean) {
    for (const layer of Object.values(this.layers))
      layer.removeEvent(event, forceClear);
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
    await this.boardRuntime.renderPieces();
  }

  applyDrawResult(
    ctx_: TSafeCtx & {
      __drawRegions: TDrawRegion[];
      __clearRegions: () => void;
    },
    layer: TCanvasLayer,
    event?: TEvents,
    record?: TPieceId
  ) {
    const regions = ctx_.__drawRegions;
    if (!regions.length) return;

    for (const coords of regions) {
      if (record) {
        this.getLayer(layer).addCoords(record, coords);
      }
      if (event) this.getLayer(layer).addEvent(event, coords);
    }

    ctx_.__clearRegions();
  }

  getEventEnabled() {
    return this.interaction;
  }

  isSelectionEnabled() {
    return this.interaction.selection;
  }

  isHoverEnabled() {
    return this.interaction.hover;
  }

  setHoverEnabled(b: boolean) {
    return (this.interaction.hover = b);
  }

  setSelectionEnabled(b: boolean) {
    return (this.interaction.selection = b);
  }

  resetAllLayers() {
    for (const layer of Object.values(this.layers)) layer.resetLayer();
  }
}

export default LayerManager;
