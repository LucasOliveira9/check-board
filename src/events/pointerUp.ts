import { getCanvasCoords } from "../utils/coords.ts";
import { TPointerMove } from "../types/events.ts";
import { getPiece } from "../helpers/lazyGetters.ts";

const onPointerUp = (args: TPointerMove) => {
  const { e, selectedRef, size, internalRef, pieceHoverRef, canvasRef } = args;
  if (selectedRef.current && selectedRef.current.isDragging) {
    const piece = internalRef.current[selectedRef.current.id];
    if (piece) {
      piece.x = selectedRef.current.startX || piece.x;
      piece.y = selectedRef.current.startY || piece.y;
    }
  }

  selectedRef.current = null;
  canvasRef.current && (canvasRef.current.style.cursor = "default");
};

export default onPointerUp;
