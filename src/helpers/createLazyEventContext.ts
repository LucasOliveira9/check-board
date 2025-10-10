type Resolvers<T> = { [k in keyof T]: () => T[k] };
export type TBase = Record<string, any>;
export type TResolved = Record<string, any>;
export type LazyReturn<TBase, TResolved> = TBase &
  TResolved & {
    toPlain: () => TBase & TResolved;
    clearCache: () => void;
  };
function createLazyEventContext<TBase, TResolved>(
  base: TBase,
  resolvers: Resolvers<TResolved>,
  opts?: { cache?: boolean }
): LazyReturn<TBase, TResolved> {
  const cache = new Map<string, any>();
  const result: any = { ...base };
  const useCache = opts?.cache ?? true;

  for (const key of Object.keys(resolvers) as Array<keyof TResolved>) {
    Object.defineProperty(result, key, {
      enumerable: true,
      configurable: true,
      get() {
        if (useCache && cache.has(key as string))
          return cache.get(key as string);
        const value = (resolvers as any)[key]();
        if (useCache) cache.set(key as string, value);
        return value;
      },
    });
  }
  result.toPlain = () => {
    const plain: any = { ...base };
    for (const k of Object.keys(resolvers) as Array<keyof TResolved>) {
      plain[k] = (result as any)[k];
    }
    return plain as TBase & TResolved;
  };

  result.clearCache = () => {
    return cache.clear();
  };

  return result;
}
export default createLazyEventContext;
