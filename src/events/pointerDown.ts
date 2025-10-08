import { coordsToSquare, getCanvasCoords } from "../utils/coords";
import { TPointerDown } from "../types/events";
import { TPieceId } from "../types/piece";

const onPointerDown = (args: TPointerDown) => {
  const { e, isBlackView, size, selectedRef, internalRef } = args;
  const { offsetX, offsetY } = getCanvasCoords(e);

  if (!offsetX || !offsetY) return;
  const square = coordsToSquare(offsetX, offsetY, size, isBlackView);
  if (!square) return;

  for (const [id, piece] of Object.entries(internalRef.current)) {
    if (piece.square.notation === square.notation) {
      selectedRef.current = {
        id: id as TPieceId,
        x: piece.x,
        y: piece.y,
        square: piece.square,
        isDragging: false,
        startX: offsetX,
        startY: offsetY,
      };
    }
  }
};

export default onPointerDown;
