import { squareToCoords } from "../utils/coords";
import { TDrawBoard } from "../types/draw";
import defaultOnSelect from "../interactions/onSelect";
import triggerEvent from "../helpers/triggerEvent";
import { TBoardEventContext } from "../types/events";

const Draw = (args: TDrawBoard) => {
  const {
    canvas,
    size,
    darkTile,
    lightTile,
    internalRef,
    piecesImage,
    selectedRef,
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
  ctx.lineWidth = 8;
  ctx.strokeStyle = "rgba(29, 18, 2, 1)";
  ctx.strokeRect(0, 0, size, size);

  // selected
  if (selectedRef.current) {
    const sqr = internalRef.current[selectedRef.current.id]
      ? squareToCoords(selectedRef.current.square, squareSize, isBlackView)
      : null;

    if (sqr) {
      const { x, y } = sqr;
      const contexto: TBoardEventContext = { ctx, squareSize, x, y, size };
      events?.select
        ? triggerEvent(
            events,
            "select",
            injection ? injection(contexto) : contexto
          )
        : defaultOnSelect(contexto);
    }
  }

  // draw piece
  for (const [id, piece] of Object.entries(internalRef.current)) {
    if (piecesImage) {
      const image = piecesImage[piece.type];
      if (image && image.complete && image.naturalWidth > 0) {
        ctx.drawImage(image, piece.x, piece.y, squareSize, squareSize);
      }
    }
  }
};

export default Draw;
