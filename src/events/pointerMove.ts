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
  } else pieceHoverRef.current = null;
  if (
    selectedRef.current &&
    selectedRef.current.startX &&
    selectedRef.current.startY
  ) {
    const dx = offsetX - selectedRef.current.startX;
    const dy = offsetY - selectedRef.current.startY;
    if (Math.sqrt(dx * dx + dy * dy) > 3 /*&& !promotionRef.current.isProm*/) {
      pieceHoverRef.current = null;
      if (selectedRef.current.id) {
        const piece = internalRef.current[selectedRef.current.id];
        if (piece && !selectedRef.current.isDragging) {
          selectedRef.current.x = offsetX - piece.x;
          selectedRef.current.y = offsetY - piece.y;
        }
        selectedRef.current.isDragging = true;
        canvasRef.current && (canvasRef.current.style.cursor = "grabbing");

        const clampX = offsetX - selectedRef.current.x;
        const clampY = offsetY - selectedRef.current.y;

        piece.x = Math.max(0, Math.min(clampX, size - size / 8));
        piece.y = Math.max(0, Math.min(clampY, size - size / 8));
      }
    }
  }
};

export default onPointerMove;
