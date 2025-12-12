import { TCanvasCoords } from "types";

class SpatialNode {
  constructor(public id: string, public box: TCanvasCoords) {}
}

export default SpatialNode;
