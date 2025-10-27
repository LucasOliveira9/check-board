type TPrimitive = string | number | boolean | symbol | null | undefined;

type TDeepReadonly<T> = T extends TPrimitive
  ? T
  : T extends Array<infer U>
  ? ReadonlyArray<TDeepReadonly<U>>
  : T extends Map<infer V, infer Z>
  ? ReadonlyMap<TDeepReadonly<V>, TDeepReadonly<Z>>
  : T extends Set<infer X>
  ? ReadonlySet<TDeepReadonly<X>>
  : { readonly [P in keyof T]: TDeepReadonly<T[P]> };

export type { TPrimitive, TDeepReadonly };
