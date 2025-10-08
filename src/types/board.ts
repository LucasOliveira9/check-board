export type TBoard = {
  config: TConfig;
};

export type TConfig = {
  isBlackView: boolean;
  size: number;
  lightTile: string;
  darkTile: string;
};
