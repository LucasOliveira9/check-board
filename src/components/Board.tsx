import { useEffect, useCallback } from "react";
import { TBoard } from "../types/board";

const Board: React.FC<TBoard> = ({
  boardRuntime,
  boardRef,
  piecesRef,
  overlayRef,
}) => {
  const size = boardRuntime.current?.getSize() || 0;

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      boardRuntime.current?.boardEvents.OnPointerDown(e);
    },
    [boardRuntime]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      boardRuntime.current?.boardEvents.onPointerMove(e);
    },
    [boardRuntime]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      boardRuntime.current?.boardEvents.onPointerUp(e);
    },
    [boardRuntime]
  );

  const handlePointerLeave = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      boardRuntime.current?.boardEvents.onPointerLeave(e);
    },
    [boardRuntime]
  );

  useEffect(() => {
    return () => {
      boardRuntime.current?.destroy();
      boardRuntime.current = null;
      boardRef.current = null;
      piecesRef.current = null;
      overlayRef.current = null;
    };
  }, [boardRuntime]);

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      boardRuntime.current?.destroy();
      boardRuntime.current = null;
      boardRef.current = null;
      piecesRef.current = null;
      overlayRef.current = null;
    });
  }

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
      }}
    >
      <canvas
        ref={boardRef}
        width={size}
        height={size}
        style={{
          display: "block",
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      <canvas
        ref={piecesRef}
        width={size}
        height={size}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          background: "transparent",
          zIndex: 2,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
      />
      <canvas
        ref={overlayRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          background: "transparent",
          pointerEvents: "none",
          zIndex: 1,
        }}
        width={size}
        height={size}
      />
    </div>
  );
};

export default Board;
