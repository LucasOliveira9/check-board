import { TDeepReadonly } from "../types/utils";

function deepFreeze<T>(obj: T): TDeepReadonly<T> {
  if (obj === null || typeof obj !== "object" || Object.isFrozen(obj))
    return obj as TDeepReadonly<T>;

  if (obj instanceof Array) {
    obj.forEach((val, i) => {
      (obj as any)[i] = deepFreeze(val);
    });
  } else if (obj instanceof Map) {
    obj.forEach((val, key) => {
      obj.set(deepFreeze(key), deepFreeze(val));
    });
  } else if (obj instanceof Set) {
    const val = Array.from(obj).map(deepFreeze);
    obj.clear();
    val.forEach((val) => obj.add(val));
  } else {
    Object.getOwnPropertyNames(obj).forEach((prop) => {
      const value = (obj as any)[prop];
      (obj as any)[prop] = deepFreeze(value);
    });
  }
  return Object.freeze(obj) as TDeepReadonly<T>;
}

export default deepFreeze;
