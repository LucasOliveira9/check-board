import { TBoardEventContext } from "../types/events";

type LazyResolvers = {
  piece?: () => any;
  square?: () => any;
  piecesImage?: () => any;
};

export type LazyContextOptions<TExtra extends object = {}> = Omit<
  TBoardEventContext,
  keyof TExtra
> &
  TExtra & {
    resolvers?: LazyResolvers;
  };

function createLazyEventContext<TExtra extends object = {}>(
  opts: LazyContextOptions<TExtra>
): TBoardEventContext & TExtra {
  const cache: Record<string, unknown> = {};

  return new Proxy(opts, {
    get(target, prop: string) {
      if (prop in cache) return cache[prop];

      if (prop in (target.resolvers || {})) {
        const value = (target.resolvers as any)[prop]?.();
        cache[prop] = value;
        return value;
      }

      return (target as any)[prop];
    },
  }) as TBoardEventContext & TExtra;
}
export default createLazyEventContext;
