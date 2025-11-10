import { TPieceBoard } from "../../types/piece";

interface BoardHandled {
  setBoard(b: TPieceBoard[]): void;
  flip(): void;
  getBoard(): TPieceBoard[] | null;
}

export type { BoardHandled };
