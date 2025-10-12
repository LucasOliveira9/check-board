import { TBoardEvent } from "src/types/events.ts";

const defaultOnSelect: TBoardEvent = ({ ctx, squareSize, x, y }) => {
  ctx.beginPath();
  ctx.arc(
    x + squareSize / 2,
    y + squareSize / 2,
    squareSize * 0.3,
    0,
    Math.PI * 2
  );
  ctx.strokeStyle = "rgba(229, 255, 0, 1)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = "rgba(30, 255, 0, 0.61)";
  ctx.fill();
};

export default defaultOnSelect;
