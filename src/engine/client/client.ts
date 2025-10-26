import { TPieceBoard } from "src/types/piece";
import BoardRuntime from "../BoardRuntime/BoardRuntime";

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

  public setBoard(board: TPieceBoard[]) {
    this.getRuntime()?.setBoard(board);
  }
}

export default Client;
