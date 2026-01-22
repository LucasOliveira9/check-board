import BoardRuntime from "./boardRuntime";

class BoardEvents {
  constructor(protected boardRuntime: BoardRuntime) {
    this.boardRuntime = boardRuntime;
  }

  destroy() {
    for (const key of Object.getOwnPropertyNames(this)) {
      (this as any)[key] = null;
    }
  }

  OnPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (this.boardRuntime.getIsMoving()) return;
    this.boardRuntime.getEventEmitter().emit("onPointerDown");
    this.boardRuntime.helpers.pointerEventsHelper.startPress(e);
  }

  onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (this.boardRuntime.getIsMoving()) return;
    this.boardRuntime.getEventEmitter().emit("onPointerMove");
    this.boardRuntime.helpers.pointerEventsHelper.handlePieceHover(e);
    this.boardRuntime.helpers.pointerEventsHelper.handleGrab(e);
  }

  onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    this.boardRuntime.helpers.pointerEventsHelper.handlePointerUp(e);
    if (this.boardRuntime.getIsMoving()) return;
    this.boardRuntime.getEventEmitter().emit("onPointerUp");
  }

  onPointerLeave(e: React.PointerEvent<HTMLCanvasElement>) {
    if (this.boardRuntime.getIsMoving()) return;
    this.boardRuntime.helpers.pointerEventsHelper.handlePointerLeave(e);
  }
}
export default BoardEvents;
