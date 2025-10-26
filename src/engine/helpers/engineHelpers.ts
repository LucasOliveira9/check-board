import { TEventName, TLazyReturn, TResolvers } from "../../types/helpers";
import BoardRuntime from "../BoardRuntime/BoardRuntime";
import PieceHelpers from "./pieceHelpers";
import { TBoardEventContext, TBoardEvents } from "../../types/events";
import {
  getCanvasCoords,
  coordsToSquare,
  squareToCoords,
} from "../../utils/coords";
import { TFile, TNotation, TRank, TSquare } from "../../types/square";
import { TPieceBoard, TPieceInternalRef } from "../../types/piece";

class EngineHelpers {
  public pieceHelper: PieceHelpers = new PieceHelpers();
  constructor(protected boardRuntime: BoardRuntime) {}

  destroy() {
    this.pieceHelper.destroy();
    for (const key of Object.getOwnPropertyNames(this)) {
      (this as any)[key] = null;
    }
  }

  createLazyEventContext<TBase, TResolved>(
    base: TBase,
    resolvers: TResolvers<TResolved>,
    opts?: { cache: boolean }
  ): TLazyReturn<TBase, TResolved> {
    const cache = new Map<string, any>();
    const result: any = { ...base };
    const useCache = opts?.cache ?? true;

    for (const key of Object.keys(resolvers) as Array<keyof TResolved>) {
      Object.defineProperty(result, key, {
        enumerable: true,
        configurable: true,
        get() {
          if (useCache && cache.has(key as string))
            return cache.get(key as string);
          const value = (resolvers as any)[key]();
          if (useCache) cache.set(key as string, value);
          return value;
        },
      });
    }
    result.toPlain = () => {
      const plain: any = { ...base };
      for (const k of Object.keys(resolvers) as Array<keyof TResolved>) {
        plain[k] = (result as any)[k];
      }
      return plain as TBase & TResolved;
    };

    result.clearCache = () => {
      return cache.clear();
    };

    result.destroy = () => {
      (resolvers as any) = null;
      (base as any) = null;
      return cache.clear();
    };

    return result;
  }

  triggerEvent<T extends TBoardEventContext = TBoardEventContext>(
    events: TBoardEvents<T> | undefined,
    event: TEventName<T>,
    args: T
  ) {
    try {
      events?.[event]?.(args);
    } finally {
      if ("destroy" in args && typeof args["destroy"] === "function")
        (args as any).destroy();
    }
  }

  detectMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const { offsetX, offsetY } = getCanvasCoords(e);
    const selected = this.boardRuntime.getSelected();
    const squareSize = this.boardRuntime.getSize() / 8,
      isBlackView = this.boardRuntime.getIsBlackView();
    const piece = selected && this.boardRuntime.getInternalRefVal(selected.id);

    const sqr = coordsToSquare(offsetX, offsetY, squareSize, isBlackView);
    const coords = squareToCoords(sqr, squareSize, isBlackView);
    if (selected && selected.isDragging) {
      if (piece && sqr && coords) {
        const { x, y } = coords;
        piece.square = sqr;
        piece.x = x;
        piece.y = y;
      }
    }

    const square = coordsToSquare(offsetX, offsetY, squareSize, isBlackView);

    if (selected && square?.notation === selected.square.notation) {
      selected &&
        this.boardRuntime.setSelected({
          ...selected,
          isDragging: false,
          startX: null,
          startY: null,
        });

      return { from: null, to: null, piece: null };
    } else if (!selected || !square || !piece) {
      selected &&
        this.boardRuntime.setSelected({
          ...selected,
          isDragging: false,
          startX: null,
          startY: null,
        });

      return { from: null, to: null, piece: null };
    }
    const piece_ = this.boardRuntime
      .getBoard()
      .find((curr) => curr.id === selected.id);
    if (piece_) {
      return { from: selected.square, to: square, piece: piece_ };
    }
    return { from: null, to: null, piece: null };
  }

  move(from: TNotation, to: TNotation, piece: TPieceBoard) {
    const piece_ = this.boardRuntime.getInternalRefVal(piece.id);
    // IMPLEMENTAR LÓGICA DO CLIENT MOVE
    const moveCallback = this.boardRuntime.getMove();
    if (moveCallback) {
      const board = moveCallback({ from, to, piece });
      if (board) {
        this.boardRuntime.setSelected(null);
        this.boardRuntime.setBoard(board);
        return true;
      } else {
        const selected = this.boardRuntime.getSelected();
        selected && ((piece_.x = selected.x), (piece_.y = selected.y));
        this.boardRuntime.setSelected(null);
        this.boardRuntime.setBoard(this.boardRuntime.getBoard());
        return false;
      }
    } else {
      // DEFAULT
      piece.square = {
        file: to.charAt(0) as TFile,
        rank: parseInt(to.charAt(1), 10) as TRank,
        notation: to,
      };
      this.boardRuntime.setSelected(null);
      this.boardRuntime.initInternalRef(true);
      this.boardRuntime.helpers.pieceHelper.updateCache(from, to, {
        id: piece?.id,
        piece: this.boardRuntime.getInternalRefVal(piece.id),
      });
      this.boardRuntime.renderPieces();
      this.boardRuntime.renderOverlay();
    }
    return true;
  }
}

export default EngineHelpers;
