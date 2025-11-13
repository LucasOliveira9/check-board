import { TPieceInternalRef, TPieceType } from "src/types/piece";
import BoardRuntime from "../BoardRuntime/BoardRuntime";
import Iterators from "../iterators/iterators";
import DefaultDraw from "./defaultDraw";
import { TRender } from "../../types/draw";
import Utils from "../../utils/utils";

class Draw {
  defaultDraw;
  protected iterator;
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
    const ctx = this.boardRuntime.getCanvasLayers().getContext("pieces");
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
      Utils.isRenderer2D(renderer) && renderer.getToRender("pieces");
    const staticToClear =
      Utils.isRenderer2D(renderer) && renderer.getToClear("pieces");
    const toRenderDynamic =
      Utils.isRenderer2D(renderer) && renderer.getToRender("dynamicPieces");
    const dynamicToClear =
      Utils.isRenderer2D(renderer) && renderer.getToClear("dynamicPieces");

    // clear static pieces
    if (staticToClear && staticToClear.length && type === "static") {
      for (const coords of staticToClear) {
        renderer.clearRect(coords, "pieces");
      }
      renderer.resetToClear("pieces");
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

    // draw hover piece
    if (pieceHoverRef && !selectedRef?.isDragging && ctxDynamicPieces) {
      const piece = internalRef[pieceHoverRef];
      const canvas = this.boardRuntime
        .getCanvasLayers()
        .getCanvas("dynamicPieces").current
        ? this.boardRuntime.getCanvasLayers().getCanvas("dynamicPieces").current
        : undefined;
      if (piece && !piece.anim) {
        const context = this.boardRuntime.getContext(true, {
          squareSize,
          x: piece.x,
          y: piece.y,
          size,
          piece: piece,
          square: piece.square,
        });

        events?.onPointerHover
          ? this.boardRuntime.helpers.triggerEvent(
              events,
              "onPointerHover",
              injection ? injection(context) : context
            )
          : this.iterator.defaultOnHover({
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

  downOverlay() {
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

    //ctx?.clearRect(0, 0, size, size);
    if (selectedRef?.id && ctx) {
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

        events?.onPointerSelect
          ? this.boardRuntime.helpers.triggerEvent(
              events,
              "onPointerSelect",
              injection ? injection(context) : context
            )
          : this.iterator.defaultOnSelect({
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

  upOverlay() {
    const ctx = this.boardRuntime.getCanvasLayers().getContext("overlayUp"),
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
      Utils.isRenderer2D(renderer) && renderer.getToClear("overlayUp");

    if (toClear && toClear.length) {
      for (const coords of toClear) renderer.clearRect(coords, "overlayUp");
      renderer.resetToClear("overlayUp");
    }

    //ctx?.clearRect(0, 0, size, size);
    if (selectedRef?.id && ctx) {
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

        events?.onPointerSelect
          ? this.boardRuntime.helpers.triggerEvent(
              events,
              "onPointerSelect",
              injection ? injection(context) : context
            )
          : this.iterator.defaultOnSelect({
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
}

export default Draw;
