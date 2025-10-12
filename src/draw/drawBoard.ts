import { squareToCoords } from "../utils/coords.ts";
import { TDrawBoard } from "../types/draw.ts";
import defaultOnSelect from "../interactions/onSelect.ts";
import triggerEvent from "../helpers/triggerEvent.ts";
import { TBoardEventContext } from "../types/events.ts";
import defaultOnHover from "../interactions/onHover.ts";
import createLazyEventContext from "../helpers/createLazyEventContext.ts";
import { getPiece } from "../helpers/lazyGetters.ts";
import defaultOnPieceDraw from "../interactions/onPieceDraw.ts";

const Draw = (args: TDrawBoard) => {
  const {
    canvas,
    size,
    darkTile,
    lightTile,
    internalRef,
    piecesImage,
    selectedRef,
    pieceHoverRef,
    isBlackView,
    events,
    injection,
  } = args;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, size, size);

  const squareSize = size / 8;
  // draw board
  for (let rank = 0; rank < 8; ++rank) {
    for (let file = 0; file < 8; ++file) {
      const isLight = (rank + file) % 2 === 0;
      ctx.fillStyle = isLight ? lightTile : darkTile;
      ctx.fillRect(
        rank * squareSize,
        file * squareSize,
        squareSize,
        squareSize
      );
    }
  }

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
};

export default Draw;
