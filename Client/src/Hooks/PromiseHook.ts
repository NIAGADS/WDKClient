import { useEffect, useState } from 'react';

interface PromiseFactory<T> {
  (): Promise<T>;
}

/**
 * Accepts a function that returns a Promise.
 * Returns `undefined` or the settled value of the Promise.
 * If the provided function does not handle Promise rejection, it will be lost.
 */
export function usePromise<T>(factory: PromiseFactory<T>, deps?: any[]) {
  let doSetValue = true;
  const [ value, setValue ] = useState<T>();
  useEffect(() => {
    factory().then(value => {
      if (doSetValue) setValue(value);
    });
    return () => { doSetValue = false };
  }, deps);
  return value;
}