// src/index.ts

export { default as Board } from "./components/BoardEngine";

// Tipos públicos da biblioteca
export * from "./types";

// API do client
export type { BoardHandled as Client } from "./engine/client/interface";
