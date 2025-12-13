import BoardRuntime from "../boardRuntime/boardRuntime";
import {
  TCanvasCoords,
  TCanvasLayer,
  TDrawRegion,
  TEvents,
  TLazyReturn,
} from "types";
import Utils from "../../utils/utils";

class Events {
  eventsLayerMap: Record<TEvents, TCanvasLayer | null> = {
    onPointerSelect: "underlay",
    onPointerHover: "dynamicPieces",
    onPointerDragStart: "dynamicPieces",
    onPointerDrag: "dynamicPieces",
    onPointerDrop: null,
    onAnimationFrame: null,
    onDrawPiece: null,
    onDrawBoard: null,
    onDrawOverlay: null,
    onDrawUnderlay: null,
  };

  eventsRunMap: Record<TEvents, Function> = {
    onPointerSelect: this.onPointerSelect.bind(this),
    onPointerHover: this.onPointerHover.bind(this),
    onPointerDragStart: this.onPointerDragStart.bind(this),
    onPointerDrag: this.onPointerDrag.bind(this),
    onPointerDrop: this.onPointerDrop.bind(this),
    onAnimationFrame: this.onAnimationFrame.bind(this),
    onDrawPiece: this.onDrawPiece.bind(this),
    onDrawBoard: this.onDrawBoard.bind(this),
    onDrawOverlay: this.onDrawOverlay.bind(this),
    onDrawUnderlay: this.onDrawUnderlay.bind(this),
  };
  constructor(protected boardRuntime: BoardRuntime) {}

  getEventLayer(event: TEvents) {
    return this.eventsLayerMap[event];
  }

  onPointerHover(
    ctx: CanvasRenderingContext2D & {
      __drawRegions: TDrawRegion[];
      __clearRegions: () => void;
      __actualRegions: TCanvasCoords[];
    }
  ) {
    const size = this.boardRuntime.getSize(),
      piecesImage = this.boardRuntime.getPieceStyle(),
      internalRef = this.boardRuntime.getInternalRefObj(),
      pieceHoverRef = this.boardRuntime.getPieceHover(),
      selectedRef = this.boardRuntime.getSelected(),
      events = this.boardRuntime.getEvents(),
      squareSize = Math.ceil(size / 8),
      injection = this.boardRuntime.getInjection();

    if (pieceHoverRef && !selectedRef?.isDragging) {
      const piece = internalRef[pieceHoverRef];
      const canvas = this.boardRuntime
        .getCanvasLayers()
        .getCanvas("dynamicPieces").current
        ? this.boardRuntime.getCanvasLayers().getCanvas("dynamicPieces").current
        : undefined;

      if (piece && !piece.anim) {
        if (events?.onPointerHover) {
          let context = this.boardRuntime.getContext(true, {
            squareSize,
            x: piece.x,
            y: piece.y,
            size,
            piece: piece,
            square: piece.square,
          });

          (context as any).__event = "onPointerHover";
          this.boardRuntime.helpers.triggerEvent(
            events,
            "onPointerHover",
            injection ? injection(context) : context
          );

          return;
        }

        this.boardRuntime.renderer
          .getLayerManager()
          .getIterator()
          .defaultOnHover({
            ctx,
            size,
            squareSize,
            x: piece.x,
            y: piece.y,
            canvas: canvas ? canvas : undefined,
            piece: piece,
            square: piece.square,
            piecesImage: piecesImage,
          });
      }
    }
  }

  onPointerSelect(
    ctx: CanvasRenderingContext2D & {
      __drawRegions: TDrawRegion[];
      __clearRegions: () => void;
      __actualRegions: TCanvasCoords[];
    }
  ) {
    const isBlackView = this.boardRuntime.getIsBlackView(),
      size = Math.ceil(this.boardRuntime.getSize()),
      piecesImage = this.boardRuntime.getPieceStyle(),
      internalRef = this.boardRuntime.getInternalRefObj(),
      selectedRef = this.boardRuntime.getSelected(),
      events = this.boardRuntime.getEvents(),
      injection = this.boardRuntime.getInjection();
    const squareSize = size / 8;

    if (!selectedRef?.id || !ctx) return;

    const sqr = internalRef[selectedRef.id]
      ? Utils.squareToCoords(selectedRef.square, squareSize, isBlackView)
      : null;

    if (sqr) {
      const { x, y } = sqr;
      const piece_ = this.boardRuntime.helpers.pieceHelper.getPieceAt(
        x,
        y,
        squareSize,
        isBlackView,
        internalRef
      )?.piece;

      if (events?.onPointerSelect) {
        const context = this.boardRuntime.getContext(true, {
          squareSize,
          x: x,
          y: y,
          size,
          piece: piece_,
          square: selectedRef.square,
        });
        (context as any).__event = "onPointerSelect";
        this.boardRuntime.helpers.triggerEvent(
          events,
          "onPointerSelect",
          injection ? injection(context) : context
        );

        return;
      }
      this.boardRuntime.renderer
        .getLayerManager()
        .getIterator()
        .defaultOnSelect({
          ctx,
          x,
          y,
          size,
          squareSize,
          getPiece: piece_,
          getPiecesImage: piecesImage,
          getSquare: selectedRef.square,
        });
    }
  }

  onPointerDragStart() {
    const selected = this.boardRuntime.getSelected();
    if (!selected || !selected.isDragging) return;
    this.boardRuntime.getCanvasLayers().setCanvasStyle("staticPieces", {
      cursor: "grabbing",
    });
    return;
  }

  onPointerDrag() {
    const selected = this.boardRuntime.getSelected();
    const squareSize = Math.ceil(this.boardRuntime.getSize() / 8);
    if (!selected || !selected.isDragging) return;
    const piece = this.boardRuntime.getInternalRefVal(selected.id);
    if (!piece) return;
    const layer = this.boardRuntime.renderer
      .getLayerManager()
      .getLayer("dynamicPieces");

    layer.addCoords(selected.id, {
      x: piece.x,
      y: piece.y,
      w: squareSize,
      h: squareSize,
    });
  }
  onPointerDrop() {
    return;
  }
  onAnimationFrame() {
    return;
  }
  onDrawPiece() {
    return;
  }
  onDrawBoard() {
    return;
  }
  onDrawOverlay() {
    return;
  }
  onDrawUnderlay() {
    return;
  }

  run(event: TEvents) {
    const handler = this.eventsRunMap[event];
    if (!handler) return;

    const layer = this.getEventLayer(event);
    const ctx = layer
      ? this.boardRuntime.getCanvasLayers().getContext(layer)
      : null;
    handler(ctx);
  }
}

export default Events;
