import { getCanvasCoords } from "../utils/coords";
import { TPointerMove } from "../types/events";
import { TPieceId } from "../types/piece";

const onPointerMove = (args: TPointerMove) => {
  const { e, selectedRef, size, internalRef, pieceHoverRef } = args;
  const { offsetX, offsetY } = getCanvasCoords(e);
  const squareSize = size / 8;
  if (
    (selectedRef.current && !selectedRef.current.isDragging) ||
    !selectedRef.current
  ) {
    const hover = Object.entries(internalRef.current).find(([id, piece]) => {
      return (
        offsetX >= piece.x &&
        offsetX <= piece.x + squareSize &&
        offsetY >= piece.y &&
        offsetY <= piece.y + squareSize
      );
    });

    if (hover) {
      const [id, _] = hover;
      pieceHoverRef.current = id as TPieceId;
    } else pieceHoverRef.current = null;
  }
  return;
};

export default onPointerMove;
