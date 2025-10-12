import { useEffect, useRef } from "react";
import Draw from "../draw/drawBoard.ts";
import { TBoard, TConfig, TSelected } from "../types/board.ts";
import { TPieceId, TPieceInternalRef } from "../types/piece.ts";
import { squareToCoords } from "../utils/coords.ts";
import onPointerDown from "../events/pointerDown.ts";
import { TBoardEventContext } from "../types/events.ts";
import onPointerMove from "../events/pointerMove.ts";
import onPointerUp from "../events/pointerUp.ts";
import pieceStyle from "../helpers/pieceStyle.ts";

const Board: React.FC<TBoard> = ({
  config,
  pieceConfig,
  pieces,
  events,
  injection,
}) => {
  const { size, isBlackView, darkTile, lightTile } = config;
  const drawRef = useRef<number>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const internalRef = useRef<Record<TPieceId, TPieceInternalRef>>(
    {} as Record<TPieceId, TPieceInternalRef>
  );
  const selectedRef = useRef<TSelected | null>(null);
  const pieceHoverRef = useRef<TPieceId | null>(null);
  const pieceStyleRef = useRef(pieceStyle[pieceConfig.type]);
  useEffect(() => {
    const squareSize = size / 8;
    for (const piece of pieces) {
      const existing = internalRef.current[piece.id as TPieceId];
      const square =
        piece.square && squareToCoords(piece.square, squareSize, isBlackView);
      if (square && !piece.square.captured) {
        if (!existing) {
          internalRef.current[piece.id as TPieceId] = {
            square: piece.square,
            type: piece.type,
            x: square.x,
            y: square.y,
          };
        }
      }
    }
  }, [pieces, isBlackView]);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    // manter qualidade
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + "px";
    canvas.style.height = size + "px";
    ctx.scale(dpr, dpr);

    const render = (time: number) => {
      Draw({
        size: size,
        isBlackView: isBlackView,
        canvas,
        lightTile: lightTile ? lightTile : "#9a8b6dff",
        darkTile: darkTile ? darkTile : "#3E2723",
        piecesImage: pieceConfig.piecesImage
          ? pieceConfig.piecesImage
          : pieceStyleRef.current,
        internalRef,
        selectedRef,
        events,
        pieceHoverRef,
        injection,
      });
      drawRef.current = requestAnimationFrame(render);
    };
    drawRef.current = requestAnimationFrame(render);

    return () => {
      if (drawRef.current) cancelAnimationFrame(drawRef.current);
    };
  }, [size, isBlackView, size]);
  return (
    <canvas
      style={{ display: "block" }}
      ref={canvasRef}
      onPointerDown={(e: React.PointerEvent<HTMLCanvasElement>) =>
        onPointerDown({
          e,
          size,
          isBlackView,
          selectedRef,
          internalRef,
        })
      }
      onPointerMove={(e: React.PointerEvent<HTMLCanvasElement>) =>
        onPointerMove({
          e,
          size,
          isBlackView,
          selectedRef,
          internalRef,
          pieceHoverRef,
          canvasRef,
        })
      }
      onPointerUp={(e: React.PointerEvent<HTMLCanvasElement>) =>
        onPointerUp({
          e,
          size,
          isBlackView,
          selectedRef,
          internalRef,
          pieceHoverRef,
          canvasRef,
        })
      }
      onPointerLeave={() => (pieceHoverRef.current = null)}
    />
  );
};

export default Board;
