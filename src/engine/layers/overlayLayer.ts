import { TDrawRegion } from "types";
import BoardRuntime from "../boardRuntime/boardRuntime";
import BaseLayer from "./baseLayer";

class OverlayLayer extends BaseLayer {
  constructor(boardRuntime: BoardRuntime) {
    super("overlay", boardRuntime);
  }

  update(delta: number): void {
    return;
  }

  async draw(): Promise<void> {
    return;
  }
}

export default OverlayLayer;
