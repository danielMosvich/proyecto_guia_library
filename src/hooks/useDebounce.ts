import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce rapid value changes (e.g. search input keystrokes)
 * @param value The value to debounce
 * @param delay Milliseconds to wait before updating debounced value
 */
export function useDebounce<T>(value: T, delay: number = 280): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
