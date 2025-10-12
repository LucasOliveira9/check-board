import { TBoardEvent } from "src/types/events.ts";

const defaultOnSelect: TBoardEvent = ({ ctx, squareSize, x, y }) => {
  const SELECT_COLOR = "#ffc400ff";
  const SELECT_GLOW = "rgba(255, 196, 0, 0.75)";

  ctx.beginPath();
  ctx.arc(
    x + squareSize / 2,
    y + squareSize / 2,
    squareSize * 0.35,
    0,
    Math.PI * 2
  );
  ctx.strokeStyle = SELECT_COLOR;
  ctx.lineWidth = 3;
  ctx.fillStyle = SELECT_GLOW;
  ctx.stroke();
  ctx.fill();
};

export default defaultOnSelect;
