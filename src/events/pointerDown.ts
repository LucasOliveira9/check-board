import { coordsToSquare, getCanvasCoords } from "../utils/coords";
import { TPointerDown } from "../types/events";
import { TPieceId } from "../types/piece";
import { getPiece } from "../helpers/lazyGetters";

const onPointerDown = (args: TPointerDown) => {
  const { e, isBlackView, size, selectedRef, internalRef } = args;
  const { offsetX, offsetY } = getCanvasCoords(e);

  if (offsetX === null || offsetY === null) return;
  const square = coordsToSquare(offsetX, offsetY, size, isBlackView);
  if (!square) return;

  const piece_ = getPiece.at(
    offsetX,
    offsetY,
    size / 8,
    isBlackView,
    internalRef
  );
  if (piece_) {
    selectedRef.current = {
      id: piece_.id,
      x: piece_.piece.x,
      y: piece_.piece.y,
      square: piece_.piece.square,
      isDragging: false,
      startX: offsetX,
      startY: offsetY,
    };
  }
};

export default onPointerDown;
