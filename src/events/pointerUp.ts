import { getCanvasCoords } from "../utils/coords";
import { TPointerMove } from "../types/events";
import { getPiece } from "../helpers/lazyGetters";

const onPointerUp = (args: TPointerMove) => {
  const { e, selectedRef, size, internalRef, pieceHoverRef } = args;
};

export default onPointerUp;
