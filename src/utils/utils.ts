import { TDrawRegion, TSafeCtx } from "../types/draw";
import { IRenderer, IRenderer2D } from "../engine/render/interface";
import { TSquare, TFile, TRank, TNotation } from "../types/square";
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

  static notationToSquare(notation: TNotation): TSquare | null {
    if (notation.length !== 2) return null;

    const file = notation.charAt(0);
    const rank = parseInt(notation.charAt(1));

    if (!/^[a-h]$/.test(file)) return null;
    else if (rank < 1 || rank > 8) return null;

    return { file, rank, notation } as TSquare;
  }

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
    return "addToClear" in r;
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
    let currentPath: { x: number; y: number }[] = [];
    const recordedRegions: TDrawRegion[] = [];

    function recordRegion(
      type: string,
      x: number,
      y: number,
      w: number,
      h: number
    ) {
      if (!Number.isFinite(x) || !Number.isFinite(y) || w <= 0 || h <= 0)
        return;
      recordedRegions.push({ x, y, w, h, type });
    }

    function sampleQuadratic(p0: any, p1: any, p2: any, step = 0.05) {
      const pts: { x: number; y: number }[] = [];
      for (let t = 0; t <= 1.001; t += step) {
        const x =
          (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
        const y =
          (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;
        pts.push({ x, y });
      }
      return pts;
    }

    function sampleBezier(p0: any, p1: any, p2: any, p3: any, step = 0.05) {
      const pts: { x: number; y: number }[] = [];
      for (let t = 0; t <= 1.001; t += step) {
        const x =
          Math.pow(1 - t, 3) * p0.x +
          3 * Math.pow(1 - t, 2) * t * p1.x +
          3 * (1 - t) * Math.pow(t, 2) * p2.x +
          Math.pow(t, 3) * p3.x;
        const y =
          Math.pow(1 - t, 3) * p0.y +
          3 * Math.pow(1 - t, 2) * t * p1.y +
          3 * (1 - t) * Math.pow(t, 2) * p2.y +
          Math.pow(t, 3) * p3.y;
        pts.push({ x, y });
      }
      return pts;
    }

    function getFontSize(ctx: CanvasRenderingContext2D): number {
      const font = ctx.font;
      const match = font.match(/(\d+(?:\.\d+)?)px/);
      return match ? parseFloat(match[1]) : 16;
    }

    const safeCtx = new Proxy(ctx, {
      get(target, prop: string, receiver) {
        if (cache.has(prop)) return cache.get(prop);

        if (forbiddenMethods.has(prop)) {
          const blocked = () =>
            console.warn(`⚠️ [SafeCtx] Access to ${prop}() is restricted.`);
          cache.set(prop, blocked);
          return blocked;
        }

        const value = Reflect.get(target, prop, receiver);
        if (typeof value !== "function") {
          cache.set(prop, value);
          return value;
        }

        const wrapped = (...args: any[]) => {
          try {
            switch (prop) {
              case "beginPath":
                currentPath = [];
                break;

              case "moveTo":
              case "lineTo": {
                const [x, y] = args;
                if (Number.isFinite(x) && Number.isFinite(y))
                  currentPath.push({ x, y });
                break;
              }

              case "rect": {
                const [x, y, w, h] = args;
                recordRegion(prop, x, y, w, h);
                currentPath.push({ x, y }, { x: x + w, y: y + h });
                break;
              }

              case "arc": {
                const [x, y, r] = args;
                if (
                  Number.isFinite(x) &&
                  Number.isFinite(y) &&
                  Number.isFinite(r)
                ) {
                  recordRegion(prop, x - r, y - r, r * 2, r * 2);
                  currentPath.push(
                    { x: x - r, y: y - r },
                    { x: x + r, y: y + r }
                  );
                }
                break;
              }

              case "ellipse": {
                const [x, y, rx, ry] = args;
                if (Number.isFinite(x) && Number.isFinite(y) && rx && ry) {
                  recordRegion(prop, x - rx, y - ry, rx * 2, ry * 2);
                  currentPath.push(
                    { x: x - rx, y: y - ry },
                    { x: x + rx, y: y + ry }
                  );
                }
                break;
              }

              case "quadraticCurveTo": {
                const [cx, cy, x, y] = args;
                const last = currentPath[currentPath.length - 1];
                if (last && Number.isFinite(cx) && Number.isFinite(cy)) {
                  const pts = sampleQuadratic(last, { x: cx, y: cy }, { x, y });
                  currentPath.push(...pts);
                } else {
                  currentPath.push({ x, y });
                }
                break;
              }

              case "bezierCurveTo": {
                const [cx1, cy1, cx2, cy2, x, y] = args;
                const last = currentPath[currentPath.length - 1];
                if (last && [cx1, cy1, cx2, cy2, x, y].every(Number.isFinite)) {
                  const pts = sampleBezier(
                    last,
                    { x: cx1, y: cy1 },
                    { x: cx2, y: cy2 },
                    { x, y }
                  );
                  currentPath.push(...pts);
                } else {
                  currentPath.push({ x, y });
                }
                break;
              }

              case "fill":
              case "stroke": {
                const arg = args[0];
                if (arg instanceof Path2D) {
                  recordRegion(prop, 0, 0, ctx.canvas.width, ctx.canvas.height);
                } else if (currentPath.length) {
                  const xs = currentPath.map((p) => p.x);
                  const ys = currentPath.map((p) => p.y);
                  const minX = Math.min(...xs);
                  const minY = Math.min(...ys);
                  const maxX = Math.max(...xs);
                  const maxY = Math.max(...ys);
                  const pad = Math.max((ctx.lineWidth ?? 1) * 0.75, 1);
                  recordRegion(
                    prop,
                    minX - pad,
                    minY - pad,
                    maxX - minX + pad * 2,
                    maxY - minY + pad * 2
                  );
                  currentPath = [];
                }
                break;
              }

              case "fillRect":
              case "strokeRect": {
                const [x, y, w, h] = args;
                const pad = ctx.lineWidth ?? 2;
                recordRegion(prop, x - pad, y - pad, w + pad * 2, h + pad * 2);
                break;
              }

              case "fillText":
              case "strokeText": {
                const [text, x, y] = args;
                if (
                  typeof text !== "string" ||
                  !Number.isFinite(x) ||
                  !Number.isFinite(y)
                )
                  break;

                // Extrai o tamanho da fonte atual (ex: "20px monospace" → 20)
                const fontSize = getFontSize(ctx);

                // Mede o texto com base na fonte atual
                const metrics = ctx.measureText(text);
                const ascent =
                  metrics.actualBoundingBoxAscent || fontSize * 0.8;
                const descent =
                  metrics.actualBoundingBoxDescent || fontSize * 0.2;
                const width = metrics.width || text.length * fontSize * 0.5;

                // Padding assimétrico
                const padTop = fontSize * 0.35; // um pouco maior no topo
                const padBottom = fontSize * 0.15; // menor embaixo
                const padSides = fontSize * 0.2; // menor nas laterais

                // Base inicial do bounding box
                let leftX = x;
                let topY = y - ascent;

                // Ajuste horizontal conforme textAlign
                switch (ctx.textAlign) {
                  case "center":
                    leftX = x - width / 2;
                    break;
                  case "right":
                  case "end":
                    leftX = x - width;
                    break;
                  // left/start = default
                }

                // Ajuste vertical conforme baseline
                switch (ctx.textBaseline) {
                  case "top":
                    topY = y;
                    break;
                  case "middle":
                    topY = y - ascent * 0.6;
                    break;
                  case "bottom":
                    topY = y - ascent - descent;
                    break;
                  case "alphabetic":
                  default:
                    topY = y - ascent;
                    break;
                }

                // Dimensões finais
                const rectX = leftX - padSides;
                const rectY = topY - padTop;
                const rectW = width + padSides * 2;
                const rectH = ascent + descent + padTop + padBottom;

                // Debug visual opcional (ver bordas)
                /*ctx.save();
                ctx.strokeStyle = "rgba(255,0,0,0.4)";
                ctx.strokeRect(rectX, rectY, rectW, rectH);
                ctx.restore();*/

                recordRegion(prop, rectX, rectY, rectW, rectH);
                break;
              }

              case "drawImage": {
                let img: CanvasImageSource | null = null;
                let dx = 0,
                  dy = 0,
                  dw = 0,
                  dh = 0;

                if (args.length === 3) {
                  [img, dx, dy] = args;
                  dw = (img as any)?.width ?? 32;
                  dh = (img as any)?.height ?? 32;
                } else if (args.length === 5) {
                  [img, dx, dy, dw, dh] = args;
                } else if (args.length === 9) {
                  [, , , , , dx, dy, dw, dh] = args;
                  img = args[0];
                }

                if (img instanceof HTMLVideoElement) {
                  console.warn(
                    "⚠️ [SafeCtx] drawImage with video is blocked for safety reasons."
                  );
                  return;
                }

                const pad = Math.max((ctx.lineWidth ?? 1) * 0.75, 1);
                recordRegion(
                  "drawImage",
                  dx - pad,
                  dy - pad,
                  dw + pad * 2,
                  dh + pad * 2
                );
                break;
              }
            }
          } catch (err) {
            console.warn(`[SafeCtx:${prop}]`, err);
          }

          return value.apply(ctx, args);
        };

        const bound = wrapped.bind(ctx);
        cache.set(prop, bound);
        return bound;
      },

      set(target, prop, value) {
        if (forbiddenProps.has(prop as string)) {
          console.warn(
            `⚠️ [SafeCtx] Modification to ${String(prop)} is restricted.`
          );
          return false;
        }
        (target as any)[prop] = value;
        return true;
      },
    });

    (safeCtx as any).__drawRegions = recordedRegions;
    (safeCtx as any).__currentPath = currentPath;
    (safeCtx as any).__clearRegions = () => (recordedRegions.length = 0);

    return safeCtx as CanvasRenderingContext2D & {
      __drawRegions: TDrawRegion[];
      __clearRegions: () => void;
    };
  }
}

export default Utils;
