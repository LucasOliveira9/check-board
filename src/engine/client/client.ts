import { TNotation } from "../../types/square";
import { TPieceInternalRef } from "../../types/piece";
import BoardRuntime from "../BoardRuntime/BoardRuntime";
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

  public setBoard(board: string, force?: boolean) {
    if (force) {
      this.clearFenStream();
      this.pauseFenStream = false;
    }
    this.fenStream.push(board);
    if (!this.loading) this.loadPosition();
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
          this.getRuntime()?.setBlackView(!this.getRuntime().getIsBlackView());
          this.toFlip = false;
        }
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
        if (this.fenStream.length && !this.pauseFenStream) this.loadPosition();
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

  public togglePause() {
    this.pauseFenStream = !this.pauseFenStream;
    if (!this.pauseFenStream && !this.loading) this.loadPosition();
  }

  public getBoard(): string {
    return Utils.parseBoard(this.getRuntime().getBoard());
  }

  public flip() {
    if (!this.fenStream.length || this.pauseFenStream)
      this.getRuntime()?.setBlackView(!this.getRuntime().getIsBlackView());
    else this.toFlip = true;
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
