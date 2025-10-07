const Draw = (args) => {
    const { canvas, size, blackTile, lightTile } = args;
    const ctx = canvas.getContext("2d");
    if (!ctx)
        return;
    ctx.clearRect(0, 0, size, size);
    const squareSize = size / 8;
    // draw board
    for (let rank = 0; rank < 8; ++rank) {
        for (let file = 0; file < 8; ++file) {
            const isLight = (rank + file) % 2 === 0;
            ctx.fillStyle = isLight ? lightTile : blackTile;
            ctx.fillRect(rank * squareSize, file * squareSize, squareSize, squareSize);
        }
    }
    ctx.lineWidth = 8;
    ctx.strokeStyle = "rgba(29, 18, 2, 1)";
    ctx.strokeRect(0, 0, size, size);
};
export default Draw;
