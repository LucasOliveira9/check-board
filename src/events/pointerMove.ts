import { getCanvasCoords } from "../utils/coords";
import { TPointerMove } from "../types/events";

const onPointerMove = (args: TPointerMove) => {
  const { e, selectedRef, size, internalRef } = args;
  const { offsetX, offsetY } = getCanvasCoords(e);
  const squareSize = size / 8;
  if (
    (selectedRef.current && !selectedRef.current.isDragging) ||
    !selectedRef.current
  ) {
    const hover = Object.entries(internalRef.current).find(([_, piece]) => {
      return (
        offsetX >= piece.x &&
        offsetX <= piece.x + squareSize &&
        offsetY >= piece.y &&
        offsetY <= piece.y + squareSize
      );
    });
  }
  return;
};

export default onPointerMove;
