import { TDrawRegion } from "types";
import BoardRuntime from "../BoardRuntime/BoardRuntime";
import BaseLayer from "./baseLayer";

class OverlayLayer extends BaseLayer {
  constructor(boardRuntime: BoardRuntime) {
    super("overlay", boardRuntime);
  }

  update(delta: number): void {
    return;
  }

  draw(
    ctx: CanvasRenderingContext2D & {
      __drawRegions: TDrawRegion[];
      __clearRegions: () => void;
    }
  ): void {
    return;
  }
}

export default OverlayLayer;
