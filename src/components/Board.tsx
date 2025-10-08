import { useEffect, useRef } from "react";
import Draw from "../draw/drawBoard";
import { TBoard, TConfig } from "../types/board";
import { TPieceId, TPieceInternalRef } from "../types/piece";
import { squareToCoords } from "../utils/coords";

const Board: React.FC<TBoard> = ({ config, piecesImage, pieces }) => {
  const { size, isBlackView, darkTile, lightTile } = config;
  const drawRef = useRef<number>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const internalRef = useRef<Record<TPieceId, TPieceInternalRef>>(
    {} as Record<TPieceId, TPieceInternalRef>
  );

  useEffect(() => {
    const squareSize = size / 8;
    for (const piece of pieces) {
      const existing = internalRef.current[piece.id];
      const square =
        piece.square && squareToCoords(piece.square, squareSize, isBlackView);
      if (square && !piece.square.captured) {
        if (!existing) {
          internalRef.current[piece.id] = {
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
        lightTile: lightTile,
        darkTile: darkTile,
        piecesImage,
        internalRef,
      });
      drawRef.current = requestAnimationFrame(render);
    };
    drawRef.current = requestAnimationFrame(render);

    return () => {
      if (drawRef.current) cancelAnimationFrame(drawRef.current);
    };
  }, [size, isBlackView]);
  return <canvas ref={canvasRef} />;
};

export default Board;
