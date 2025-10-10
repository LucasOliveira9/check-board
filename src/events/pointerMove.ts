import { getCanvasCoords } from "../utils/coords";
import { TPointerMove } from "../types/events";
import { getPiece } from "../helpers/lazyGetters";

const onPointerMove = (args: TPointerMove) => {
  const { e, selectedRef, size, internalRef, pieceHoverRef } = args;
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
      return;
    }

    pieceHoverRef.current = searchPiece.id;
    return;
  }
};

export default onPointerMove;
