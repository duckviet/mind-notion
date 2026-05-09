import { useCallback, useState } from "react";

type StateUpdater<T> = T | ((prev: T) => T);

interface OpenState<T> {
  isOpen: boolean;
  data: T;
}

const resolveNextData = <T>(prev: T, next?: StateUpdater<T>): T => {
  if (typeof next === "function") {
    return (next as (prev: T) => T)(prev);
  }
  return next ?? prev;
};

export function useOpenState<T>(initialData: T) {
  const [state, setState] = useState<OpenState<T>>({
    isOpen: false,
    data: initialData,
  });

  const open = useCallback((nextData?: StateUpdater<T>) => {
    setState((prev) => ({
      isOpen: true,
      data: resolveNextData(prev.data, nextData),
    }));
  }, []);

  const close = useCallback(
    (resetData = true) => {
      setState((prev) => ({
        isOpen: false,
        data: resetData ? initialData : prev.data,
      }));
    },
    [initialData],
  );

  const setData = useCallback((nextData: StateUpdater<T>) => {
    setState((prev) => ({
      ...prev,
      data: resolveNextData(prev.data, nextData),
    }));
  }, []);

  return { state, open, close, setData };
}
