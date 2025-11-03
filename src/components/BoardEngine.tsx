import { useRef, useState, useEffect, useImperativeHandle } from "react";
import CanvasLayers from "../engine/BoardRuntime/canvasLayers";
import { TBoardEngine, TBoardRuntime } from "../types/board";
import Board from "./Board";
import BoardRuntime from "../engine/BoardRuntime/BoardRuntime";
import Client from "../engine/client/client";
import React from "react";
import { BoardHandled } from "../engine/client/interface";

const BoardEngine = React.forwardRef<BoardHandled, TBoardEngine>(
  ({ config }, ref) => {
    const { isBlackView, pieceConfig, board, size } = config;
    const boardCanvasRef = useRef<HTMLCanvasElement>(null);
    const pieceCanvasRef = useRef<HTMLCanvasElement>(null);
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
    const overlayUpCanvasRef = useRef<HTMLCanvasElement>(null);
    const dynamicPiecesRef = useRef<HTMLCanvasElement>(null);
    //
    const boardRuntime = useRef<BoardRuntime>(null);
    const clientRef = useRef<Client>(null);

    useEffect(() => {
      if (!boardRuntime.current) return;
      boardRuntime.current.setSelected(null);
      boardRuntime.current.setBoard(board);
    }, [board]);

    useEffect(() => {
      if (!boardRuntime.current) return;
      boardRuntime.current.setBlackView(isBlackView);
    }, [isBlackView]);

    useEffect(() => {
      if (boardRuntime.current) {
        boardRuntime.current.destroy();
        boardRuntime.current = null;
      }
      const args: TBoardRuntime = {
        ...config,
        canvasLayers: new CanvasLayers(
          boardCanvasRef,
          pieceCanvasRef,
          overlayCanvasRef,
          overlayUpCanvasRef,
          dynamicPiecesRef,
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
        pieceCanvasRef.current = null;
        overlayCanvasRef.current = null;
        overlayUpCanvasRef.current = null;
        dynamicPiecesRef.current = null;
      };
    }, []);

    if (import.meta.hot) {
      import.meta.hot.dispose(() => {
        boardRuntime.current?.destroy();
        boardRuntime.current = null;
        boardCanvasRef.current = null;
        pieceCanvasRef.current = null;
        overlayCanvasRef.current = null;
        overlayUpCanvasRef.current = null;
        dynamicPiecesRef.current = null;
      });
    }

    useImperativeHandle(ref, () => ({
      setBoard: (b) => {
        if (!clientRef.current) return;
        clientRef.current.setBoard(b);
      },
      setBlackView: (b) => {
        if (!clientRef.current) return;
        clientRef.current.setBlackView(b);
      },
    }));

    return (
      <Board
        boardRuntime={boardRuntime}
        boardRef={boardCanvasRef}
        piecesRef={pieceCanvasRef}
        overlayRef={overlayCanvasRef}
        overlayUpRef={overlayUpCanvasRef}
        dynamicPiecesRef={dynamicPiecesRef}
        size={size}
      />
    );
  }
);

export default BoardEngine;
