import { useEffect, useState } from "react";

// Debounce a rapidly changing value so network-backed filters do not refetch on every keystroke.
// The hook waits for `delayMs` of inactivity, then publishes the latest value to the caller.
export const useDebounce = <T>(value: T, delayMs = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [delayMs, value]);

  return debouncedValue;
};
