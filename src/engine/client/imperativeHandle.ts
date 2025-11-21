import Client from "./client";
import { BoardHandled } from "./interface";

function imperativeHandle(
  clientRef: React.RefObject<Client | null>
): BoardHandled {
  return {
    loadPosition: (b) => {
      if (!clientRef.current) return;
      clientRef.current.setBoard(b);
    },
    flip: () => {
      if (!clientRef.current) return;
      clientRef.current.flip();
    },
    getBoard: () => {
      if (!clientRef.current) return null;
      return clientRef.current.getBoard();
    },
    getSquareCoords: (notation) => {
      if (!clientRef.current) return null;
      return clientRef.current.getSquareCoords(notation);
    },
  };
}

export default imperativeHandle;
