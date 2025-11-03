import { IRenderer, IRenderer2D } from "../engine/render/interface";
import { TSquare, TFile, TRank } from "../types/square";
import { TDeepReadonly } from "../types/utils";

class Utils {
  static files = "abcdefgh";

  private constructor() {}

  static squareToCoords(
    square: TSquare | null,
    squareSize: number,
    isBlackView: boolean
  ) {
    if (square) {
      const file = this.files.indexOf(square.file);
      const rank = square.rank - 1;
      if (!isBlackView) {
        return { x: file * squareSize, y: (7 - rank) * squareSize };
      }
      return { x: (7 - file) * squareSize, y: rank * squareSize };
    }
  }

  static coordsToSquare = (
    x: number,
    y: number,
    squareSize: number,
    isBlackView: boolean
  ): TSquare | null => {
    let file = Math.floor(x / squareSize);
    let rank = 7 - Math.floor(y / squareSize);
    if (file < 0 || file > 7 || rank < 0 || rank > 8) return null;
    if (isBlackView) {
      file = 7 - Math.floor(x / squareSize);
      rank = Math.floor(y / squareSize);
    }
    const file_ = this.files[file] as TFile, //toFile(files[file]),
      rank_ = (rank + 1) as TRank; //toRank(rank + 1);

    if (file_ && rank_)
      return { file: file_, rank: rank_, notation: `${file_}${rank_}` };
    return null;
  };

  static getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();

    return { offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top };
  };

  static deepFreeze<T>(obj: T): TDeepReadonly<T> {
    const obj_ = structuredClone(obj);
    if (obj_ === null || typeof obj_ !== "object" || Object.isFrozen(obj_))
      return obj_ as TDeepReadonly<T>;

    if (obj_ instanceof Array) {
      obj_.forEach((val, i) => {
        (obj_ as any)[i] = this.deepFreeze(val);
      });
    } else if (obj_ instanceof Map) {
      obj_.forEach((val, key) => {
        obj_.set(this.deepFreeze(key), this.deepFreeze(val));
      });
    } else if (obj_ instanceof Set) {
      const val = Array.from(obj_).map(this.deepFreeze);
      obj_.clear();
      val.forEach((val) => obj_.add(val));
    } else {
      Object.getOwnPropertyNames(obj_).forEach((prop) => {
        const value = (obj_ as any)[prop];
        (obj_ as any)[prop] = this.deepFreeze(value);
      });
    }
    return Object.freeze(obj_) as TDeepReadonly<T>;
  }

  static isRenderer2D(r: IRenderer, method: string): r is IRenderer2D {
    return method in r;
  }
}

export default Utils;
