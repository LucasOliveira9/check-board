import { TPieceBoard } from "../../types/piece";

interface BoardHandled {
  setBoard(b: TPieceBoard[]): void;
}

export type { BoardHandled };
