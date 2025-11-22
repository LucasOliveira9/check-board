import { TPieceType } from "../../types/piece";
import BoardRuntime from "../BoardRuntime/BoardRuntime";
import Iterators from "../iterators/iterators";
import DefaultDraw from "./defaultDraw";
import Utils from "../../utils/utils";

class Draw {
  defaultDraw;
  protected iterator;
  protected pointerSelected = false;
  protected pointerHover = false;
  constructor(protected boardRuntime: BoardRuntime) {
    this.defaultDraw = new DefaultDraw(boardRuntime);
    this.iterator = new Iterators(boardRuntime);
  }

  destroy() {
    this.defaultDraw.destroy();
    this.iterator.destroy();

    for (const key of Object.getOwnPropertyNames(this)) {
      (this as any)[key] = null;
    }
  }

  board() {
    const ctx = this.boardRuntime.getCanvasLayers().getContext("board");
    if (!ctx) return;

    const size = this.boardRuntime.getSize(),
      isBlackView = this.boardRuntime.getIsBlackView(),
      lightTile = this.boardRuntime.getLightTile(),
      darkTile = this.boardRuntime.getDarkTile();

    ctx.clearRect(0, 0, size, size);

    const squareSize = size / 8;
    const firstColor = !isBlackView ? lightTile : darkTile,
      secondColor = !isBlackView ? darkTile : lightTile;

    // draw board
    for (let rank = 0; rank < 8; ++rank) {
      for (let file = 0; file < 8; ++file) {
        const isLight = (rank + file) % 2 === 0;
        const rank_ = isBlackView ? 7 - rank : rank;
        const file_ = isBlackView ? 7 - file : file;
        ctx.fillStyle = isLight ? firstColor : secondColor;
        ctx.fillRect(
          file_ * squareSize,
          rank_ * squareSize,
          squareSize,
          squareSize
        );
      }
    }
  }

  pieces(type: TPieceType, time?: number) {
    const ctx = this.boardRuntime.getCanvasLayers().getContext("staticPieces");
    const ctxDynamicPieces = this.boardRuntime
      .getCanvasLayers()
      .getContext("dynamicPieces");
    if (!ctx) return;

    const isBlackView = this.boardRuntime.getIsBlackView(),
      size = this.boardRuntime.getSize(),
      piecesImage = this.boardRuntime.getPieceStyle(),
      internalRef = this.boardRuntime.getInternalRefObj(),
      pieceHoverRef = this.boardRuntime.getPieceHover(),
      selectedRef = this.boardRuntime.getSelected(),
      events = this.boardRuntime.getEvents(),
      injection = this.boardRuntime.getInjection();

    const renderer = this.boardRuntime.renderer;
    const squareSize = size / 8;
    const toRenderStatic =
      Utils.isRenderer2D(renderer) && renderer.getToRender("staticPieces");
    const staticToClear =
      Utils.isRenderer2D(renderer) && renderer.getToClear("staticPieces");
    const toRenderDynamic =
      Utils.isRenderer2D(renderer) && renderer.getToRender("dynamicPieces");
    const dynamicToClear =
      Utils.isRenderer2D(renderer) && renderer.getToClear("dynamicPieces");

    // clear static pieces
    if (staticToClear && staticToClear.length && type === "static") {
      for (const coords of staticToClear) {
        renderer.clearRect(coords, "staticPieces");
      }
      renderer.resetToClear("staticPieces");
    }
    // clear dynamic pieces
    if (dynamicToClear && dynamicToClear.length && type === "dynamic") {
      for (const coords of dynamicToClear) {
        renderer.clearRect(coords, "dynamicPieces");
      }
      renderer.resetToClear("dynamicPieces");
    }

    //draw static pieces
    if (type === "static" && toRenderStatic && toRenderStatic.size) {
      const context = this.boardRuntime.getContext(true, {
        squareSize,
        x: 0,
        y: 0,
        size,
        square: selectedRef?.square,
      });

      events?.onDrawPiece
        ? this.boardRuntime.helpers.triggerEvent(
            events,
            "onDrawPiece",
            injection ? injection(context) : context,
            time
          )
        : this.defaultDraw.drawStaticPiece();
    } else if (type === "dynamic" && toRenderDynamic && toRenderDynamic.size) {
      this.defaultDraw.drawDynamicPieces(time || 0);
    }

    // draw default hover piece
    if (
      pieceHoverRef &&
      !selectedRef?.isDragging &&
      ctxDynamicPieces &&
      !events?.onPointerHover &&
      !this.pointerHover
    ) {
      const piece = internalRef[pieceHoverRef];
      const canvas = this.boardRuntime
        .getCanvasLayers()
        .getCanvas("dynamicPieces").current
        ? this.boardRuntime.getCanvasLayers().getCanvas("dynamicPieces").current
        : undefined;
      if (piece && !piece.anim) {
        this.iterator.defaultOnHover({
          ctx: ctxDynamicPieces,
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
    this.boardRuntime.updateAnimation();
  }

  underlay() {
    const ctx = this.boardRuntime.getCanvasLayers().getContext("underlay"),
      isBlackView = this.boardRuntime.getIsBlackView(),
      size = this.boardRuntime.getSize(),
      piecesImage = this.boardRuntime.getPieceStyle(),
      internalRef = this.boardRuntime.getInternalRefObj(),
      selectedRef = this.boardRuntime.getSelected(),
      events = this.boardRuntime.getEvents(),
      injection = this.boardRuntime.getInjection();
    const squareSize = size / 8;
    const renderer = this.boardRuntime.renderer;
    const toClear =
      Utils.isRenderer2D(renderer) && renderer.getToClear("underlay");

    if (toClear && toClear.length) {
      for (const coords of toClear) renderer.clearRect(coords, "underlay");
      renderer.resetToClear("underlay");
    }

    if (
      selectedRef?.id &&
      ctx &&
      !events?.onPointerSelect &&
      !this.pointerSelected
    ) {
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

        this.iterator.defaultOnSelect({
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
  }

  overlay() {
    const ctx = this.boardRuntime.getCanvasLayers().getContext("overlay"),
      isBlackView = this.boardRuntime.getIsBlackView(),
      size = this.boardRuntime.getSize(),
      piecesImage = this.boardRuntime.getPieceStyle(),
      internalRef = this.boardRuntime.getInternalRefObj(),
      selectedRef = this.boardRuntime.getSelected(),
      events = this.boardRuntime.getEvents(),
      injection = this.boardRuntime.getInjection();
    const squareSize = size / 8;
    const renderer = this.boardRuntime.renderer;
    const toClear =
      Utils.isRenderer2D(renderer) && renderer.getToClear("overlay");

    if (toClear && toClear.length) {
      for (const coords of toClear) renderer.clearRect(coords, "overlay");
      renderer.resetToClear("overlay");
    }
  }

  clientOverlayEvents() {
    const selectedRef = this.boardRuntime.getSelected(),
      internalRef = this.boardRuntime.getInternalRefObj(),
      isBlackView = this.boardRuntime.getIsBlackView(),
      size = this.boardRuntime.getSize(),
      squareSize = size / 8,
      events = this.boardRuntime.getEvents(),
      injection = this.boardRuntime.getInjection(),
      pieceHoverRef = this.boardRuntime.getPieceHover();

    if (selectedRef?.id && events?.onPointerSelect && !this.pointerSelected) {
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

        const context = this.boardRuntime.getContext(true, {
          squareSize,
          x,
          y,
          size,
          piece: piece_,
          square: selectedRef.square,
        });

        this.boardRuntime.helpers.triggerEvent(
          events,
          "onPointerSelect",
          injection ? injection(context) : context
        );
      }
    }

    // Hover
    if (
      pieceHoverRef &&
      !selectedRef?.isDragging &&
      events?.onPointerHover &&
      !this.pointerHover
    ) {
      const piece = internalRef[pieceHoverRef];
      if (piece && !piece.anim) {
        const context = this.boardRuntime.getContext(true, {
          squareSize,
          x: piece.x,
          y: piece.y,
          size,
          piece: piece,
          square: piece.square,
        });

        this.boardRuntime.helpers.triggerEvent(
          events,
          "onPointerHover",
          injection ? injection(context) : context
        );
      }
    }
  }
  // control hover and selected
  setIsSelected(b: boolean) {
    this.pointerSelected = b;
  }

  setIsHovered(b: boolean) {
    this.pointerHover = b;
  }

  getIsSelected() {
    return this.pointerSelected;
  }

  getIsHovered() {
    return this.pointerHover;
  }
}

export default Draw;
