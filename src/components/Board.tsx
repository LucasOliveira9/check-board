import { useEffect, useRef } from "react";
import Draw from "../draw/drawBoard";
import { TBoard } from "../types/board";

const Board: React.FC<TBoard> = ({
  size,
  isBlackView,
  lightTile,
  blackTile,
}) => {
  const drawRef = useRef<number>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
      Draw({ size, isBlackView, canvas, lightTile, blackTile });
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
