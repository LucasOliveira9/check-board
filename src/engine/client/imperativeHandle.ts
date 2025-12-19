import Client from "./client";
import { BoardHandled } from "./interface";

function imperativeHandle(
  clientRef: React.RefObject<Client | null>
): BoardHandled {
  return {
    loadPosition: (b, f) => {
      if (!clientRef.current) return;
      clientRef.current.setBoard(b, f);
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
    togglePause: () => {
      if (!clientRef.current) return;
      clientRef.current.togglePause();
    },
    loadFenStream: (b) => {
      if (!clientRef.current) return;
      clientRef.current.loadFenStream(b);
    },

    setfenStreamDelay: (n) => {
      if (!clientRef.current) return;
      clientRef.current.setfenStreamDelay(n);
    },

    updateSize: (size) => {
      if (!clientRef.current) return;
      clientRef.current.updateSize(size);
    },

    getPieceAt: (notation) => {
      if (!clientRef.current) return null;
      return clientRef.current.getPieceAt(notation);
    },

    setPieceType: (type) => {
      if (!clientRef.current) return;
      clientRef.current.setPieceType(type);
    },
  };
}

export default imperativeHandle;
