import { TCanvasCoords } from "types";
import Utils from "../../utils/utils";

class SpatialNode {
  hash: number;
  constructor(public id: string, public box: TCanvasCoords) {
    const { P1, P2, P3, P4 } = Utils.getHashingNumbers();
    this.hash = (P1 * box.x) ^ (P2 * box.y) ^ (P3 * box.w) ^ (P4 * box.h);
  }
}

export default SpatialNode;
