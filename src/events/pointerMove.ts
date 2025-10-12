import { getCanvasCoords } from "../utils/coords.ts";
import { TPointerMove } from "../types/events.ts";
import { getPiece } from "../helpers/lazyGetters.ts";

const onPointerMove = (args: TPointerMove) => {
  const { e, selectedRef, size, internalRef, pieceHoverRef, canvasRef } = args;
  const { offsetX, offsetY } = getCanvasCoords(e);
  const squareSize = size / 8;
  if (
    (selectedRef.current && !selectedRef.current.isDragging) ||
    !selectedRef.current
  ) {
    const searchPiece = getPiece.at(
      offsetX,
      offsetY,
      squareSize,
      false,
      internalRef
    );
    if (!searchPiece) {
      pieceHoverRef.current = null;
      canvasRef.current && (canvasRef.current.style.cursor = "default");
      return;
    }

    pieceHoverRef.current = searchPiece.id;
    canvasRef.current && (canvasRef.current.style.cursor = "grab");
    return;
  }
};

export default onPointerMove;
