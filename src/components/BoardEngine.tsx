import {
  useRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
} from "react";
import CanvasLayers from "../engine/layers/canvasLayers";
import { TBoardProps, TBoardRuntime } from "../types/board";
import Board from "./board";
import BoardRuntime from "../engine/boardRuntime/boardRuntime";
import Client from "../engine/client/client";
import React from "react";
import { BoardHandled } from "../engine/client/interface";
import imperativeHandle from "../engine/client/imperativeHandle";
import { TBoardEventContext } from "types";

const BoardEngine = React.forwardRef<BoardHandled, TBoardProps>(
  ({ config, onMove, onUpdate }, ref) => {
    const { pieceConfig, size } = config;

    const boardCanvasRef = useRef<HTMLCanvasElement>(null);
    const staticPiecesCanvasRef = useRef<HTMLCanvasElement>(null);
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
    const underlayCanvasRef = useRef<HTMLCanvasElement>(null);
    const dynamicPiecesCanvasRef = useRef<HTMLCanvasElement>(null);
    const onMount = useRef<(runtime: BoardRuntime) => any>(null);

    const boardRuntime = useRef<BoardRuntime | null>(null);
    const clientRef = useRef<Client | null>(null);
    const pendingMountRef = useRef<null | (() => void)>(null);

    const imperative = useMemo(
      () => imperativeHandle(clientRef, pendingMountRef),
      [],
    );

    const disposed = useRef(0);
    useEffect(() => {
      let runtime: BoardRuntime<TBoardEventContext> | null = null;
      let c: Client | null = null;
      const id = ++disposed.current;
      if (
        boardCanvasRef.current &&
        staticPiecesCanvasRef.current &&
        overlayCanvasRef.current &&
        underlayCanvasRef.current &&
        dynamicPiecesCanvasRef.current
      ) {
        const args: TBoardRuntime = {
          ...config,
          size: Math.floor(size),
          onMove,
          onUpdate,
          canvasLayers: new CanvasLayers(
            boardCanvasRef,
            staticPiecesCanvasRef,
            underlayCanvasRef,
            overlayCanvasRef,
            dynamicPiecesCanvasRef,
            Math.floor(size),
          ),
          pieceStyle: pieceConfig.piecesImage,
          mode: "2d",
        };

        (async () => {
          const create = await BoardRuntime.create(args);
          if (disposed.current !== id) {
            create.destroy();
            return;
          }

          const fun =
            onMount.current !== null ? () => onMount.current?.(create) : null;
          fun !== null && create.addOnMount(fun);
          create.mount();
          runtime = create;
          boardRuntime.current = runtime;
          c = new Client(runtime);
          clientRef.current = c;
          imperative.flushPendingMount?.();
        })();
      }

      return () => {
        disposed.current++;
        runtime?.destroy();
        c?.destroy();
        runtime = null;
        c = null;
        boardRuntime.current = null;
        clientRef.current = null;
        pendingMountRef.current = null;
      };
    }, []);

    useImperativeHandle(ref, () => imperative);

    return (
      <Board
        boardRuntime={boardRuntime}
        boardRef={boardCanvasRef}
        staticPiecesRef={staticPiecesCanvasRef}
        overlayRef={overlayCanvasRef}
        underlayRef={underlayCanvasRef}
        dynamicPiecesRef={dynamicPiecesCanvasRef}
        size={Math.floor(size)}
        onMount={onMount}
      />
    );
  },
);
export default BoardEngine;
