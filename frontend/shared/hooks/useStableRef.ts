import { useEffect, useRef } from "react";

/**
 * Keeps a ref in sync with the latest value.
 * Useful for callbacks passed to extensions that should not trigger recreation.
 */
export function useStableRef<T>(value: T) {
  const ref = useRef(value);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref;
}
