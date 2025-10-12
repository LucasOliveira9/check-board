import { TPointerMove } from "../types/events.ts";

const onPointerLeave = (args: TPointerMove) => {
  const { pieceHoverRef, selectedRef } = args;
  selectedRef.current &&
    (selectedRef.current = {
      ...selectedRef.current,
      isDragging: false,
    });
  pieceHoverRef.current = null;
};

export default onPointerLeave;
