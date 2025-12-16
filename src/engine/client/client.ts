import { TNotation } from "../../types/square";
import { TPieceInternalRef } from "../../types/piece";
import BoardRuntime from "../boardRuntime/boardRuntime";
import Utils from "../../utils/utils";

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
  private debugCountFenStream = 0;
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
    if (this.loading || this.destroyed) return;
    this.loading = true;
    try {
      while (!this.pauseFenStream && !this.destroyed && this.fenStream.length) {
        const nextFen = this.fenStream.shift();
        if (!nextFen) continue;
        console.log("rodei");
        await this.getRuntime()?.setBoardByFen(nextFen);
        if (this.toFlip) {
          await this.getRuntime()?.setBlackView(
            !this.getRuntime().getIsBlackView()
          );
          this.toFlip = false;
        }
        console.log(nextFen);
        console.log("resolvi");
        if (this.fenStreamDelay > 0) await this.delay(this.fenStreamDelay);
        if (this.toChangeStreamDelay !== null) {
          this.fenStreamDelay = this.toChangeStreamDelay;
          this.toChangeStreamDelay = null;
        }
        console.log("--------- ", ++this.debugCountFenStream);
      }
    } finally {
      if (!this.destroyed) {
        this.fenStream.length <= 0 && (this.debugCountFenStream = 0);
        this.loading = false;
        if (this.fenStream.length && !this.pauseFenStream)
          queueMicrotask(() => this.loadPosition());
      }
    }
  }

  public setfenStreamDelay(ms: number) {
    if (this.loading) this.toChangeStreamDelay = ms;
    else this.fenStreamDelay = ms;
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public async togglePause() {
    const boardRuntime = this.getRuntime();
    if (!boardRuntime) return;
    this.pauseFenStream = !this.pauseFenStream;
    if (!this.pauseFenStream && !this.loading) {
      await boardRuntime.resetEvents(true);
      this.loadPosition();
    }
  }

  public getBoard(): string {
    return Utils.parseBoard(this.getRuntime().getBoard());
  }

  public async flip() {
    if (!this.fenStream.length || this.pauseFenStream)
      await this.getRuntime()?.setBlackView(
        !this.getRuntime().getIsBlackView()
      );
    else this.toFlip = true;
  }

  public updateSize(size: number) {
    this.resizeStream.push(size);
    if (this.resizing) return;
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
      if (this.resizeStream.length) queueMicrotask(() => this.sizeStream());
    }
  }

  public getPieceAt(notation: TNotation) {
    const boardRuntime = this.getRuntime();
    if (!boardRuntime) return null;

    const internalRef = boardRuntime.getInternalRefObj();
    const hasPiece = Object.entries(internalRef).find(
      ([id, piece]) => piece.square.notation === notation
    );
    if (!hasPiece) return null;
    const [id, piece] = hasPiece;
    return { id, piece };
  }

  public getSquareCoords(notation: TNotation) {
    const boardRuntime = this.getRuntime();
    if (!boardRuntime) return null;
    const square = Utils.notationToSquare(notation);
    if (!square) return null;
    const coords = Utils.squareToCoords(
      square,
      boardRuntime.getSize() / 8,
      boardRuntime.getIsBlackView()
    );
    if (!coords) return null;
    return coords;
  }
}

export default Client;
