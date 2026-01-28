import { TNotation } from "../../types/square";
import { TPieceDisplay, TPieceInternalRef } from "../../types/piece";
import BoardRuntime from "../boardRuntime/boardRuntime";
import Utils from "../../utils/utils";
import {
  IEventListener,
  TEventListenerEvents,
  TMoveResult,
  TMoveReturn,
} from "types";

const runtimeMap = new WeakMap<Client, BoardRuntime>();

class Client {
  private destroyed = false;
  private fenStream: string[] = [];
  private fenStreamDelay = 0;
  private loading = false;
  private toFlip = false;
  private toChangeStreamDelay: number | null = null;
  private currFlip = false;
  private pauseFenStream = false;
  private resizeStream: number[] = [];
  private resizing: boolean = false;
  private toResize: boolean = false;
  private debugCountFenStream = 0;
  private isSettingPieceType = false;
  private toSetPieceType: "string" | "image" | null = null;
  private undoing = false;
  private redoing = false;
  private isMoving = false;
  private togglingPause = false;
  private cachedSize: { size: number; squareSize: number } | null = null;
  private mounted = false;
  constructor(boardRuntime: BoardRuntime) {
    runtimeMap.set(this, boardRuntime);
  }

  destroy() {
    runtimeMap.delete(this);

    for (const key of Object.getOwnPropertyNames(this)) {
      (this as any)[key] = null;
    }
    this.destroyed = true;
  }

  public mount(fun: () => void) {
    if (this.mounted) return;
    this.mounted = true;
    fun();
  }

  private getRuntime() {
    if (this.destroyed) throw new Error("Client destroyed");
    const runtime = runtimeMap.get(this);
    if (!runtime) throw new Error("Runtime not found");
    return runtime;
  }

  public getPieces(): Record<string, TPieceInternalRef> {
    return this.getRuntime()?.getReadonlyInternalRef();
  }

  public async setBoard(board: string, force?: boolean) {
    if (force) {
      this.clearFenStream();
      this.pauseFenStream = false;
    }
    this.fenStream.push(board);
    if (!this.loading) {
      await this.getRuntime()?.resetEvents(true);
      this.loadPosition();
    }
  }

  private clearFenStream() {
    this.fenStream.splice(0, this.fenStream.length);
  }

  public loadFenStream(board: string[]) {
    if (this.destroyed) return;
    this.fenStream.push(...board);
    if (!this.loading && !this.pauseFenStream) this.loadPosition();
  }

  public async loadPosition() {
    const runtime = this.getRuntime();
    if (this.loading || this.destroyed || !runtime) return;
    const eventEmitter = runtime.getEventEmitter();
    this.loading = true;
    try {
      while (!this.pauseFenStream && !this.destroyed && this.fenStream.length) {
        const nextFen = this.fenStream.shift();
        if (!nextFen) continue;
        //console.log("rodei");
        await this.getRuntime()?.setBoardByFen(nextFen);
        if (this.toFlip) {
          await this.getRuntime()?.setBlackView(
            !this.getRuntime().getIsBlackView(),
          );
          this.toFlip = false;
        }
        if (this.toResize) {
          await this.sizeStream();
          this.toResize = false;
        }

        if (this.toSetPieceType !== null) {
          await this.setPieceType(this.toSetPieceType, true);
          this.toSetPieceType = null;
        }
        //console.log(nextFen);
        //console.log("resolvi");
        if (this.fenStreamDelay > 0) await this.delay(this.fenStreamDelay);
        if (this.toChangeStreamDelay !== null) {
          this.fenStreamDelay = this.toChangeStreamDelay;
          this.toChangeStreamDelay = null;
        }
        //console.log("--------- ", ++this.debugCountFenStream);
      }
    } finally {
      if (!this.destroyed) {
        this.fenStream.length <= 0 && (this.debugCountFenStream = 0);
        this.loading = false;
        if (this.fenStream.length && !this.pauseFenStream)
          queueMicrotask(() => this.loadPosition());
        else if (!this.fenStream.length)
          eventEmitter?.emit("onFenStreamLoaded");
      }
    }
  }

  public getIsLoadingFenStream() {
    return this.fenStream.length > 0;
  }

  public setFenStreamDelay(ms: number) {
    if (this.loading) this.toChangeStreamDelay = ms;
    else this.fenStreamDelay = ms;
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public async togglePause() {
    const boardRuntime = this.getRuntime();
    if (!boardRuntime || this.togglingPause) return this.pauseFenStream;
    try {
      this.togglingPause = true;
      this.pauseFenStream = !this.pauseFenStream;
      if (!this.pauseFenStream && !this.loading) {
        await boardRuntime.resetEvents(true);
        this.loadPosition();
      }
      return !this.pauseFenStream;
    } finally {
      this.togglingPause = false;
    }
  }

  public getBoard(): string {
    return Utils.parseBoard(this.getRuntime().getBoard());
  }

  public async flip() {
    if (!this.fenStream.length || this.pauseFenStream)
      await this.getRuntime()?.setBlackView(
        !this.getRuntime().getIsBlackView(),
      );
    else this.toFlip = true;
    this.cachedSize = null;
  }

  public updateSize(size: number) {
    this.resizeStream.push(size);
    if (this.resizing) return;
    else if (this.loading) {
      this.toResize = true;
      return;
    }
    this.sizeStream();
  }

  public async sizeStream() {
    if (this.resizing) return;
    this.resizing = true;
    try {
      while (!this.destroyed && this.resizeStream.length) {
        const size = this.resizeStream.shift();
        if (size === null || size === undefined) continue;
        try {
          await this.getRuntime?.().setSize(size);
        } catch (e) {
          console.error("Resize failed:", size, e);
        }
      }
    } finally {
      if (this.destroyed) return;
      this.resizing = false;
      this.cachedSize = null;
      if (this.resizeStream.length) queueMicrotask(() => this.sizeStream());
    }
  }

  public getPieceAt(notation: TNotation) {
    const boardRuntime = this.getRuntime();
    if (!boardRuntime) return null;

    const internalRef = boardRuntime.getInternalRefObj();
    const hasPiece = Object.entries(internalRef).find(
      ([id, piece]) => piece.square?.notation === notation,
    );
    if (!hasPiece) return null;
    const [id, piece] = hasPiece;
    return { id, piece };
  }

  public async undo() {
    const boardRuntime = this.getRuntime();
    if (!boardRuntime || this.undoing) return false;
    this.undoing = true;

    try {
      const res = await boardRuntime.undo();
      return res;
    } finally {
      this.undoing = false;
    }
  }

  public async redo() {
    const boardRuntime = this.getRuntime();
    if (!boardRuntime || this.redoing) return false;
    this.redoing = true;

    try {
      const res = await boardRuntime.redo();
      return res;
    } finally {
      this.redoing = false;
    }
  }

  public getSquareCoords(notation: TNotation) {
    const boardRuntime = this.getRuntime();
    if (!boardRuntime) return null;
    const square = Utils.notationToSquare(notation);
    if (!square) return null;
    const coords = Utils.squareToCoords(
      square,
      boardRuntime.getSize() / 8,
      boardRuntime.getIsBlackView(),
    );
    if (!coords) return null;
    return coords;
  }

  public toggleHoverScaling() {
    const boardRuntime = this.getRuntime();
    if (!boardRuntime) return;
    boardRuntime.toggleHoverScaling();
  }

  public toggleHoverScale(scale: number) {
    const boardRuntime = this.getRuntime();
    if (!boardRuntime) return;
    boardRuntime.toggleHoverScale(scale);
  }

  public toggleHoverHighlight() {
    const boardRuntime = this.getRuntime();
    if (!boardRuntime) return;
    boardRuntime.toggleHoverHighlight();
  }

  public getSize() {
    const runtime = this.getRuntime();
    if (!runtime) return null;
    if (this.cachedSize !== null) return this.cachedSize;
    const size = runtime.getSize();
    const cached = { size, squareSize: size / 8 };
    this.cachedSize = cached;
    return cached;
  }

  public async makeMove(move: TMoveResult) {
    const runtime = this.getRuntime();
    if (!runtime || this.isMoving) return false;
    this.isMoving = true;

    try {
      await runtime.resetEvents(false);
      await runtime.updateBoardState(move, true);
      return true;
    } finally {
      this.isMoving = false;
    }
  }

  public async setPieceType(type: "string" | "image", force?: boolean) {
    const runtime = this.getRuntime();
    if (this.loading && !force) {
      this.toSetPieceType = type;
      return;
    }
    if (!runtime || this.isSettingPieceType || runtime.getIsMoving()) return;
    this.isSettingPieceType = true;

    try {
      await runtime.setPieceImages(type);
    } finally {
      this.isSettingPieceType = false;
    }
  }

  public getEventEmitter() {
    const runtime = this.getRuntime();
    if (!runtime) return null;
    return runtime.getEventEmitter();
  }

  public getPiecesImage() {
    const runtime = this.getRuntime();
    if (!runtime) return null;
    const piecesImage = runtime.getPieceStyle();
    if (!piecesImage) return null;
    return piecesImage;
  }
}

export default Client;
