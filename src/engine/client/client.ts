import { TNotation } from "../../types/square";
import { TPieceBoard, TPieceId, TPieceInternalRef } from "../../types/piece";
import BoardRuntime from "../BoardRuntime/BoardRuntime";
import Utils from "../../utils/utils";

const runtimeMap = new WeakMap<Client, BoardRuntime>();

class Client {
  private destroyed = false;
  constructor(boardRuntime: BoardRuntime) {
    runtimeMap.set(this, boardRuntime);
  }

  destroy() {
    runtimeMap.delete(this);
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

  public setBoard(board: string) {
    this.getRuntime()?.setBoardByFen(board);
  }

  public getBoard(): string {
    return Utils.parseBoard(this.getRuntime().getBoard());
  }

  public flip() {
    this.getRuntime()?.setBlackView(!this.getRuntime().getIsBlackView());
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
