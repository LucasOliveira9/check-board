import BoardRuntime from "../boardRuntime/boardRuntime";
import BaseLayer from "./baseLayer";

class UnderlayLayer extends BaseLayer {
  constructor(boardRuntime: BoardRuntime) {
    super("underlay", boardRuntime);
  }

  update(delta: number): void {
    return;
  }

  async draw(): Promise<void> {
    return;
  }
}

export default UnderlayLayer;
