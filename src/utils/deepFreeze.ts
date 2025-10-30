import { TDeepReadonly } from "../types/utils";

function deepFreeze<T>(obj: T): TDeepReadonly<T> {
  const obj_ = structuredClone(obj);
  if (obj_ === null || typeof obj_ !== "object" || Object.isFrozen(obj_))
    return obj_ as TDeepReadonly<T>;

  if (obj_ instanceof Array) {
    obj_.forEach((val, i) => {
      (obj_ as any)[i] = deepFreeze(val);
    });
  } else if (obj_ instanceof Map) {
    obj_.forEach((val, key) => {
      obj_.set(deepFreeze(key), deepFreeze(val));
    });
  } else if (obj_ instanceof Set) {
    const val = Array.from(obj_).map(deepFreeze);
    obj_.clear();
    val.forEach((val) => obj_.add(val));
  } else {
    Object.getOwnPropertyNames(obj_).forEach((prop) => {
      const value = (obj_ as any)[prop];
      (obj_ as any)[prop] = deepFreeze(value);
    });
  }
  return Object.freeze(obj_) as TDeepReadonly<T>;
}

export default deepFreeze;
