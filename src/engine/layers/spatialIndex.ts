import { TCanvasCoords } from "types";
import SpatialNode from "./spatialNode";
import Utils from "../../utils/utils";

const QuadtreeKeys = {
  NE: "NE",
  NW: "NW",
  SE: "SE",
  SW: "SW",
} as const;
type TQuadtreeChild = keyof typeof QuadtreeKeys;

class SpatialIndex {
  private capacity = 4;
  private boundary: TCanvasCoords;
  private objects: SpatialNode[] = [];
  private child: Record<TQuadtreeChild, SpatialIndex | null> = {
    NE: null,
    NW: null,
    SE: null,
    SW: null,
  };
  private destroyed = false;

  constructor(boundary: TCanvasCoords) {
    this.boundary = boundary;
  }

  destroy() {
    if (this.destroyed) return;

    this.destroyed = true;

    this.objects = [];
    this.child.NE?.destroy();
    this.child.NW?.destroy();
    this.child.SE?.destroy();
    this.child.SW?.destroy();

    this.child = { NE: null, NW: null, SE: null, SW: null };

    this.boundary = { x: 0, y: 0, w: 0, h: 0 };
  }

  insert(node: SpatialNode): boolean {
    if (this.destroyed) return false;

    if (!this.intersect(node.box, this.boundary)) return false;
    if (this.boundary.w <= 1 || this.boundary.h <= 1) {
      this.objects.push(node);
      return true;
    }

    if (this.objects.length < this.capacity && this.child.NE === null) {
      this.objects.push(node);
      return true;
    }

    if (this.child.NE === null) this.subdivide();
    const newObject: SpatialNode[] = [];
    for (const c of this.objects) if (!this.insertChild(c)) newObject.push(c);
    this.objects = newObject;

    if (!this.insertChild(node)) this.objects.push(node);
    return true;
  }

  intersect(box: TCanvasCoords, boundary: TCanvasCoords) {
    if (this.destroyed) return;
    return (
      box.x < boundary.x + boundary.w &&
      box.x + box.w > boundary.x &&
      box.y < boundary.y + boundary.h &&
      box.y + box.h > boundary.y
    );
  }

  contains(box: TCanvasCoords, boundary: TCanvasCoords) {
    if (this.destroyed) return;
    return (
      box.x >= boundary.x &&
      box.x + box.w <= boundary.x + boundary.w &&
      box.y >= boundary.y &&
      box.y + box.h <= boundary.y + boundary.h
    );
  }

  insertChild(node: SpatialNode) {
    if (this.destroyed) return false;

    let quad: null | SpatialIndex = null;
    for (const child of Object.values(this.child)) {
      if (!child || !child.contains(node.box, child.boundary)) continue;
      if (!quad) quad = child;
      else return false;
    }
    return quad === null ? false : quad.insert(node);
  }

  subdivide() {
    if (this.destroyed) return;

    const width = this.boundary.w / 2,
      height = this.boundary.h / 2;
    this.child.NW = new SpatialIndex({
      x: this.boundary.x,
      y: this.boundary.y,
      w: width,
      h: height,
    });
    this.child.NE = new SpatialIndex({
      x: this.boundary.x + width,
      y: this.boundary.y,
      w: width,
      h: height,
    });
    this.child.SW = new SpatialIndex({
      x: this.boundary.x,
      y: this.boundary.y + height,
      w: width,
      h: height,
    });
    this.child.SE = new SpatialIndex({
      x: this.boundary.x + width,
      y: this.boundary.y + height,
      w: width,
      h: height,
    });
  }

  search(box: TCanvasCoords, found: SpatialNode[] = []) {
    if (this.destroyed) return found;

    if (!this.intersect(box, this.boundary)) return found;

    for (const obj of this.objects) {
      if (this.intersect(obj.box, box)) found.push(obj);
    }

    if (!this.child.NE) return found;

    for (const child of Object.values(this.child)) {
      if (child && this.intersect(box, child.boundary)) {
        child.search(box, found);
      }
    }

    return found;
  }

  searchById(id: string): SpatialNode | null {
    if (this.destroyed) return null;

    for (const obj of this.objects) {
      if (obj.id === id) return obj;
    }

    if (!this.child.NE) return null;

    for (const child of Object.values(this.child)) {
      if (!child) continue;
      const found = child.searchById(id);
      if (found) return found;
    }

    return null;
  }

  remove(id: string, box: TCanvasCoords): boolean;
  remove(id: string): boolean;
  remove(id: string, box?: TCanvasCoords) {
    if (this.destroyed) return false;
    let idx = -1;
    if (box) {
      const { P1, P2, P3, P4 } = Utils.getHashingNumbers();
      const hash = (P1 * box.x) ^ (P2 * box.y) ^ (P3 * box.w) ^ (P4 * box.h);
      idx = this.objects.findIndex((o) => o.id === id && o.hash === hash);
    }
    if (idx === -1) idx = this.objects.findIndex((o) => o.id === id);

    if (idx !== -1) {
      this.objects.splice(idx, 1);
      return true;
    } else if (this.child.NE === null) return false;

    for (const child of Object.values(this.child)) {
      if (child && (box ? child.remove(id, box) : child.remove(id))) {
        this.tryMerge();
        return true;
      }
    }
    return false;
  }

  update(id: string, newBox: TCanvasCoords) {
    const node = this.searchById(id);
    if (!node) return false;
    this.remove(id);
    node.box = newBox;
    this.insert(node);
    return true;
  }

  private tryMerge() {
    if (this.destroyed) return;

    if (!this.child.NE) return;

    const allEmpty = Object.values(this.child).every(
      (c) => c && c.objects.length === 0 && !c.child.NE
    );
    if (!allEmpty) return;
    this.child = { NE: null, NW: null, SE: null, SW: null };
  }
}

export default SpatialIndex;
