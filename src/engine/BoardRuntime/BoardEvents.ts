import BoardRuntime from "./BoardRuntime";

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
    this.boardRuntime.helpers.pointerEventsHelper.handleClick(e);
  }

  onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (this.boardRuntime.getIsMoving()) return;
    this.boardRuntime.helpers.pointerEventsHelper.handlePieceHover(e);
    this.boardRuntime.helpers.pointerEventsHelper.handleGrab(e);
  }

  onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    if (this.boardRuntime.getIsMoving()) return;
    this.boardRuntime.helpers.pointerEventsHelper.handlePointerUp(e);
  }

  onPointerLeave(e: React.PointerEvent<HTMLCanvasElement>) {
    if (this.boardRuntime.getIsMoving()) return;
    this.boardRuntime.helpers.pointerEventsHelper.handlePointerLeave(e);
  }
}
export default BoardEvents;
