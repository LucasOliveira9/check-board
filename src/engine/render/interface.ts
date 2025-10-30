interface IRenderer {
  renderStaticPieces(): void;
  renderDownOverlay(): void;
  renderBoard(): void;
  renderUpOverlayAndDynamicPieces(): void;
  clear(): void;
  destroy(): void;
}

export { IRenderer };
