import { useEffect, useRef } from "react";
import Draw from "../draw/drawBoard";
import { TBoard, TConfig } from "../types/board";

const Board: React.FC<TBoard> = ({ config }) => {
  const { size, isBlackView, darkTile, lightTile } = config;
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
      Draw({
        size: size,
        isBlackView: isBlackView,
        canvas,
        lightTile: lightTile,
        darkTile: darkTile,
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
