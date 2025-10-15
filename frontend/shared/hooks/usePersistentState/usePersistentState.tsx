import { useEffect, useRef, useState, useCallback } from "react";

export default function usePersistentState<T>(
  key: string,
  initialValue: T | (() => T)
) {
  const initialValueRef = useRef(initialValue);
  const isFirst = useRef(true);
  const [value, setValue] = useState<T | null>(() => {
    if (typeof window === "undefined") return initialValueRef.current as T;

    try {
      const stored = window.localStorage.getItem(key);
      return stored ? JSON.parse(stored) : (initialValueRef.current as T);
    } catch (error) {
      console.error(`Error parsing localStorage for key ${key}:`, error);
      return initialValueRef.current as T;
    }
  });

  // Cleanup storage khi value là null/undefined
  const cleanupStorage = useCallback(
    (val: T | null | undefined) => {
      if (typeof window === "undefined") return;

      try {
        if (val == null) {
          window.localStorage.removeItem(key);
        } else {
          window.localStorage.setItem(key, JSON.stringify(val));
        }
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "QuotaExceededError"
        ) {
          console.warn(`localStorage quota exceeded for key ${key}`);
        } else {
          console.error(`Error updating localStorage for key ${key}:`, error);
        }
      }
    },
    [key]
  );

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    cleanupStorage(value);
  }, [value, cleanupStorage]);

  const clear = useCallback(() => {
    setValue(null);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(key);
      } catch (error) {
        console.error(`Error clearing localStorage for key ${key}:`, error);
      }
    }
  }, [key]);

  return [value, setValue, clear] as const;
}
