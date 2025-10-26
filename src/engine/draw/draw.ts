import { squareToCoords } from "../../utils/coords";
import BoardRuntime from "../BoardRuntime/BoardRuntime";
import Iterators from "../iterators/iterators";
import DefaultDraw from "./defaultDraw";

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
    let ctx = this.boardRuntime.getCanvasLayers().getContext("board");
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
    /*
  // selected
  if (selectedRef.current) {
    const sqr = internalRef.current[selectedRef.current.id]
      ? squareToCoords(selectedRef.current.square, squareSize, isBlackView)
      : null;

    if (sqr) {
      const { x, y } = sqr;
      const context = createLazyEventContext(
        { ctx, squareSize, x, y, size },
        {
          piece: () =>
            getPiece.at(x, y, squareSize, isBlackView, internalRef)?.piece,
          piecesImage: () => piecesImage,
          square: () => selectedRef.current?.square,
          internalRef: () => internalRef,
          pieceHoverRef: () => pieceHoverRef,
        },
        { cache: true }
      );
      events?.select
        ? triggerEvent(
            events,
            "select",
            injection ? injection(context) : context
          )
        : defaultOnSelect(context);
    }
  }

  // piece hover
  if (pieceHoverRef.current && !selectedRef.current?.isDragging) {
    const piece = internalRef.current[pieceHoverRef.current];
    if (piece) {
      const context = createLazyEventContext(
        {
          ctx,
          squareSize,
          size,
          x: piece.x,
          y: piece.y,
          isBlackView,
        },
        {
          piece: () => piece,
          square: () => piece.square,
          piecesImage: () => piecesImage,
          internalRef: () => internalRef,
          pieceHoverRef: () => pieceHoverRef,
        },
        {
          cache: true,
        }
      );

      events?.hover
        ? triggerEvent(
            events,
            "hover",
            injection ? injection(context) : context
          )
        : defaultOnHover(context);
    }
  }
  // draw piece
  const context = createLazyEventContext(
    {
      ctx,
      squareSize,
      size,
      x: 0,
      y: 0,
    },
    {
      piecesImage: () => piecesImage,
      internalRef: () => internalRef,
      pieceHoverRef: () => pieceHoverRef,
      selectedRef: () => selectedRef,
    },
    {
      cache: false,
    }
  );
  events?.drawPiece
    ? triggerEvent(
        events,
        "drawPiece",
        injection ? injection(context) : context
      )
    : defaultOnPieceDraw(context);
  /*for (const [id, piece] of Object.entries(internalRef.current)) {
    if (piecesImage && id !== pieceHoverRef.current) {
      const image = piecesImage[piece.type];
      if (image && image.complete && image.naturalWidth > 0) {
        ctx.drawImage(image, piece.x, piece.y, squareSize, squareSize);
      }
    }
  }*/
    ctx = null;
  }

  pieces(time?: number) {
    if (this.boardRuntime.getIsPieceRendering()) return;
    this.boardRuntime.setIsPieceRendering(true);

    let ctx = this.boardRuntime.getCanvasLayers().getContext("pieces");
    if (!ctx) return;

    const isBlackView = this.boardRuntime.getIsBlackView(),
      size = this.boardRuntime.getSize(),
      piecesImage = this.boardRuntime.getPieceStyle(),
      internalRef = this.boardRuntime.getInternalRefObj(),
      pieceHoverRef = this.boardRuntime.getPieceHover(),
      selectedRef = this.boardRuntime.getSelected(),
      events = this.boardRuntime.getEvents(),
      injection = this.boardRuntime.getInjection();

    const squareSize = size / 8;
    ctx.clearRect(0, 0, size, size);

    //draw pieces
    const context = this.boardRuntime.helpers.createLazyEventContext(
      {
        ctx,
        squareSize,
        size,
        x: 0,
        y: 0,
      },
      {
        piecesImage: () => piecesImage,
        internalRef: () => internalRef,
        pieceHoverRef: () => pieceHoverRef,
        selectedRef: () => selectedRef,
        animation: () => this.boardRuntime.getAnimation(),
      },
      {
        cache: false,
      }
    );

    events?.drawPiece
      ? this.boardRuntime.helpers.triggerEvent(
          events,
          "drawPiece",
          injection ? injection(context) : context
        )
      : this.defaultDraw.drawPiece(time || 0);

    // draw hover piece
    if (pieceHoverRef && !selectedRef?.isDragging) {
      const piece = internalRef[pieceHoverRef];
      if (piece && !piece.anim) {
        const context = this.boardRuntime.helpers.createLazyEventContext(
          {
            ctx,
            squareSize,
            size,
            x: piece.x,
            y: piece.y,
            isBlackView,
          },
          {
            piece: () => piece,
            square: () => piece.square,
            piecesImage: () => piecesImage,
            internalRef: () => internalRef,
            pieceHoverRef: () => pieceHoverRef,
          },
          {
            cache: true,
          }
        );

        events?.hover
          ? this.boardRuntime.helpers.triggerEvent(
              events,
              "hover",
              injection ? injection(context) : context
            )
          : this.iterator.defaultOnHover(context);
      }
    }
    ctx = null;
    this.boardRuntime.setIsPieceRendering(false);
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
        ? squareToCoords(selectedRef.square, squareSize, isBlackView)
        : null;

      if (sqr) {
        const { x, y } = sqr;
        const context = this.boardRuntime.helpers.createLazyEventContext(
          { ctx, squareSize, x, y, size },
          {
            piece: () =>
              this.boardRuntime.helpers.pieceHelper.getPieceAt(
                x,
                y,
                squareSize,
                isBlackView,
                internalRef
              )?.piece,
            piecesImage: () => piecesImage,
            square: () => selectedRef?.square,
            internalRef: () => internalRef,
            pieceHoverRef: () => pieceHoverRef,
            canvas: () =>
              this.boardRuntime.getCanvasLayers().getCanvas("overlay")
                .current || undefined,
          },
          { cache: true }
        );
        events?.select
          ? this.boardRuntime.helpers.triggerEvent(
              events,
              "select",
              injection ? injection(context) : context
            )
          : this.iterator.defaultOnSelect(context);
      }
    }
  }
}

export default Draw;
