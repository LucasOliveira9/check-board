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
    let ctx = this.boardRuntime.getCanvasLayers().getContext("pieces");
    let ctxDynamicPieces = this.boardRuntime
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
      Utils.isRenderer2D(renderer) && renderer.getStaticToRender();
    const staticToClear =
      Utils.isRenderer2D(renderer) && renderer.getStaticToClear();
    const toRenderDynamic =
      Utils.isRenderer2D(renderer) && renderer.getDynamicToRender();
    const dynamicToClear =
      Utils.isRenderer2D(renderer) && renderer.getDynamicToClear();

    // clear static pieces
    if (staticToClear && staticToClear.size && type === "static") {
      for (const id of staticToClear) {
        const coords = renderer.getStaticPosition(id);
        if (!coords) continue;
        const { x, y } = coords;
        renderer.clearPiecesRect(x, y, id, "static");
      }
    }
    // clear dynamic pieces
    if (dynamicToClear && dynamicToClear.size && type === "dynamic") {
      for (const id of dynamicToClear) {
        const coords = renderer.getDynamicPosition(id);
        if (!coords) continue;
        const { x, y } = coords;
        renderer.clearPiecesRect(x, y, id, "dynamic");
      }
    }

    //draw static pieces
    if (type === "static" && toRenderStatic && toRenderStatic.size > 0) {
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
    } else if (type === "dynamic") {
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

        events?.onHover
          ? this.boardRuntime.helpers.triggerEvent(
              events,
              "onHover",
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
    ctx = null;
    this.boardRuntime.updateAnimation();
  }

  overlay() {
    const ctx = this.boardRuntime.getCanvasLayers().getContext("overlay"),
      isBlackView = this.boardRuntime.getIsBlackView(),
      size = this.boardRuntime.getSize(),
      piecesImage = this.boardRuntime.getPieceStyle(),
      internalRef = this.boardRuntime.getInternalRefObj(),
      pieceHoverRef = this.boardRuntime.getPieceHover(),
      selectedRef = this.boardRuntime.getSelected(),
      events = this.boardRuntime.getEvents(),
      injection = this.boardRuntime.getInjection();
    const squareSize = size / 8;

    ctx?.clearRect(0, 0, size, size);
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
        const canvas = this.boardRuntime.getEventCanvasLayers("onSelect");
        const currCtx = this.boardRuntime.getCanvasLayers().getContext(canvas);
        currCtx?.clearRect(0, 0, size, size);
        const context = this.boardRuntime.getContext(true, {
          squareSize,
          x,
          y,
          size,
          piece: piece_,
          square: selectedRef.square,
        });

        events?.onSelect
          ? this.boardRuntime.helpers.triggerEvent(
              events,
              "onSelect",
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
