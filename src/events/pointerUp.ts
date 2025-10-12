import { getCanvasCoords } from "../utils/coords.ts";
import { TPointerMove } from "../types/events.ts";
import { getPiece } from "../helpers/lazyGetters.ts";

const onPointerUp = (args: TPointerMove) => {
  const { e, selectedRef, size, internalRef, pieceHoverRef } = args;
};

export default onPointerUp;
