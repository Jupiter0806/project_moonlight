import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number = 1000): T | undefined {
  const [deferredValue, setDeferredValue] = useState<T>();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDeferredValue((prev) => (prev !== value ? value : prev));
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return deferredValue;
}
