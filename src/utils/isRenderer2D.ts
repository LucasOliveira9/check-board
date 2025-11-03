import { IRenderer, IRenderer2D } from "../engine/render/interface";

function isRenderer2D(r: IRenderer, method: string): r is IRenderer2D {
  return method in r;
}

export default isRenderer2D;
