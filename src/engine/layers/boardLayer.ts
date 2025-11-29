import BoardRuntime from "../BoardRuntime/BoardRuntime";
import BaseLayer from "./baseLayer";
import { TDrawRegion } from "types";

class BoardLayer extends BaseLayer {
  constructor(boardRuntime: BoardRuntime) {
    super("board", boardRuntime);
  }
  update(delta: number): void {
    return;
  }
  draw(
    ctx: CanvasRenderingContext2D & {
      __drawRegions: TDrawRegion[];
      __clearRegions: () => void;
    }
  ): void {
    if (!ctx) return;

    const size = this.boardRuntime.getSize(),
      isBlackView = this.boardRuntime.getIsBlackView(),
      lightTile = this.boardRuntime.getLightTile(),
      darkTile = this.boardRuntime.getDarkTile();

    ctx.clearRect(0, 0, size, size);

    const squareSize = size / 8;
    const firstColor = !isBlackView ? lightTile : darkTile,
      secondColor = !isBlackView ? darkTile : lightTile;

    // draw board
    for (let rank = 0; rank < 8; ++rank) {
      for (let file = 0; file < 8; ++file) {
        const isLight = (rank + file) % 2 === 0;
        const rank_ = isBlackView ? 7 - rank : rank;
        const file_ = isBlackView ? 7 - file : file;
        ctx.fillStyle = isLight ? firstColor : secondColor;
        ctx.fillRect(
          file_ * squareSize,
          rank_ * squareSize,
          squareSize,
          squareSize
        );
      }
    }
  }
}

export default BoardLayer;
