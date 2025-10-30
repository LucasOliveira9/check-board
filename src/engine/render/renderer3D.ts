import BoardRuntime from "../BoardRuntime/BoardRuntime";
import { IRenderer } from "./interface";

class Renderer3D implements IRenderer {
  constructor(protected boardRuntime: BoardRuntime) {}
  destroy(): void {
    for (const key of Object.getOwnPropertyNames(this)) {
      (this as any)[key] = null;
    }
  }
  renderStaticPieces(): void {
    throw new Error("Method not implemented.");
  }
  renderDownOverlay(): void {
    throw new Error("Method not implemented.");
  }
  renderBoard(): void {
    throw new Error("Method not implemented.");
  }
  renderUpOverlayAndDynamicPieces(): void {
    throw new Error("Method not implemented.");
  }
  clear(): void {
    throw new Error("Method not implemented.");
  }
}

export default Renderer3D;
