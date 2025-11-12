import { TDrawRegion, TSafeCtx } from "../types/draw";
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

  static isRenderer2D(r: IRenderer): r is IRenderer2D {
    return "getStaticToClear" in r;
  }

  static createSafeCtx(ctx: CanvasRenderingContext2D) {
    const forbiddenMethods = new Set([
      "clearRect",
      "reset",
      "resetTransform",
      "restore",
      "save",
      "scale",
      "rotate",
      "translate",
      "transform",
      "setTransform",
      "clip",
      "arcTo",
    ]);

    const forbiddenProps = new Set([
      "canvas",
      "filter",
      "globalAlpha",
      "globalCompositeOperation",
    ]);

    const cache = new Map<PropertyKey, any>();
    const drawRegions: TDrawRegion[] = [];

    const recordRegion = (
      type: string,
      x: number,
      y: number,
      w: number,
      h: number
    ) => {
      drawRegions.push({ type, x, y, w, h });
    };

    const proxy = new Proxy(ctx, {
      get(target, prop: string | symbol, receiver) {
        if (typeof prop === "symbol")
          return Reflect.get(target, prop, receiver);
        if (cache.has(prop)) return cache.get(prop);

        if (forbiddenMethods.has(prop)) {
          const blocked = (...args: any[]) => {
            console.warn(
              `⚠️ [SafeCtx] Access to ${String(prop)}() is restricted.`
            );
          };
          cache.set(prop, blocked);
          return blocked;
        }

        const value = Reflect.get(target, prop, receiver);
        if (typeof value === "function") {
          const wrapped = (...args: any[]) => {
            try {
              switch (prop) {
                case "drawImage": {
                  if (args.length >= 3) {
                    const [_, dx, dy, dw, dh] = args;
                    recordRegion(
                      "drawImage",
                      dx ?? 0,
                      dy ?? 0,
                      dw ?? 0,
                      dh ?? 0
                    );
                  }
                  break;
                }
                case "fillRect":
                case "strokeRect": {
                  const [x, y, w, h] = args;
                  recordRegion(prop, x, y, w, h);
                  break;
                }
                case "fillText":
                case "strokeText": {
                  const [text, x, y] = args;
                  const metrics = ctx.measureText(text);
                  recordRegion(
                    prop,
                    x,
                    y - metrics.actualBoundingBoxAscent,
                    metrics.width,
                    metrics.actualBoundingBoxAscent +
                      metrics.actualBoundingBoxDescent
                  );
                  break;
                }
              }
            } catch {
              // ignora se o cálculo falhar
            }

            const result = value.apply(target, args);
            return result === target ? proxy : result;
          };

          cache.set(prop, wrapped);
          return wrapped;
        }

        if (prop === "__drawRegions") return drawRegions;
        cache.set(prop, value);
        return value;
      },
      set(target, prop, value) {
        if (forbiddenProps.has(prop as string)) {
          console.warn(
            `⚠️ [SafeCtx] Modification to ${String(prop)} is restricted.`
          );
          return true;
        }
        (target as any)[prop] = value;
        return true;
      },
    });
    return proxy as CanvasRenderingContext2D & { __drawRegions: TDrawRegion[] };
  }
}

export default Utils;
