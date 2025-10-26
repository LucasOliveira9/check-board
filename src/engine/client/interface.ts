import { TPieceBoard } from "../../types/piece";

interface BoardHandled {
  setBoard(b: TPieceBoard[]): void;
  setBlackView(b: boolean): void;
}

export type { BoardHandled };
