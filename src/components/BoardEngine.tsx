import { useRef, useEffect, useImperativeHandle } from "react";
import CanvasLayers from "../engine/layers/canvasLayers";
import { TBoardProps, TBoardRuntime } from "../types/board";
import Board from "./Board";
import BoardRuntime from "../engine/BoardRuntime/BoardRuntime";
import Client from "../engine/client/client";
import React from "react";
import { BoardHandled } from "../engine/client/interface";
import imperativeHandle from "../engine/client/imperativeHandle";

const BoardEngine = React.forwardRef<BoardHandled, TBoardProps>(
  ({ config, onMove, onUpdate }, ref) => {
    const { pieceConfig, size } = config;

    const boardCanvasRef = useRef<HTMLCanvasElement>(null);
    const staticPiecesCanvasRef = useRef<HTMLCanvasElement>(null);
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
    const underlayCanvasRef = useRef<HTMLCanvasElement>(null);
    const dynamicPiecesCanvasRef = useRef<HTMLCanvasElement>(null);

    const boardRuntime = useRef<BoardRuntime | null>(null);
    const clientRef = useRef<Client | null>(null);

    useEffect(() => {
      if (
        boardCanvasRef.current &&
        staticPiecesCanvasRef.current &&
        overlayCanvasRef.current &&
        underlayCanvasRef.current &&
        dynamicPiecesCanvasRef.current
      ) {
        const args: TBoardRuntime = {
          ...config,
          onMove,
          onUpdate,
          canvasLayers: new CanvasLayers(
            boardCanvasRef,
            staticPiecesCanvasRef,
            underlayCanvasRef,
            overlayCanvasRef,
            dynamicPiecesCanvasRef,
            size
          ),
          pieceStyle: pieceConfig.piecesImage,
          mode: "2d",
        };

        const runtime = new BoardRuntime(args);
        boardRuntime.current = runtime;

        runtime.init();

        const c = new Client(runtime);
        clientRef.current = c;

        return () => {
          runtime.destroy();
          c.destroy();
          boardRuntime.current = null;
          clientRef.current = null;
        };
      }
    }, []);

    useImperativeHandle(ref, () => imperativeHandle(clientRef));

    return (
      <Board
        boardRuntime={boardRuntime}
        boardRef={boardCanvasRef}
        staticPiecesRef={staticPiecesCanvasRef}
        overlayRef={overlayCanvasRef}
        underlayRef={underlayCanvasRef}
        dynamicPiecesRef={dynamicPiecesCanvasRef}
        size={size}
      />
    );
  }
);
export default BoardEngine;
