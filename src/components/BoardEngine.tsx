import { useRef, useEffect, useImperativeHandle } from "react";
import CanvasLayers from "../engine/BoardRuntime/canvasLayers";
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
    //
    const boardRuntime = useRef<BoardRuntime>(null);
    const clientRef = useRef<Client>(null);

    useEffect(() => {
      if (boardRuntime.current) {
        boardRuntime.current.destroy();
        boardRuntime.current = null;
      }
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
      const boardRuntime_ = new BoardRuntime(args);
      boardRuntime.current = boardRuntime_;
      const client_ = new Client(boardRuntime_);
      clientRef.current = client_;

      return () => {
        boardRuntime_.destroy();
        boardRuntime.current = null;
        client_.destroy();
        clientRef.current = null;
        boardCanvasRef.current = null;
        staticPiecesCanvasRef.current = null;
        overlayCanvasRef.current = null;
        underlayCanvasRef.current = null;
        dynamicPiecesCanvasRef.current = null;
      };
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
