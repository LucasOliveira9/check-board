/// <reference types="vite/client" />

import { ViteHotContext } from "vite/types/hot.js";

interface ImportMeta {
  readonly hot?: ViteHotContext;
}
