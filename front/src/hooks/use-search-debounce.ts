import { useState, useCallback, useRef, useEffect } from "react";

interface UseSearchDebounceProps {
  onSearch: (query: string) => void;
  delay?: number;
}

export function useSearchDebounce({
  onSearch,
  delay = 400,
}: UseSearchDebounceProps) {
  const [search, setSearch] = useState("");
  const timeoutRef = useRef<number | undefined>(undefined);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearch(value);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => {
        onSearch(value);
      }, delay);
    },
    [onSearch, delay]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    search,
    handleSearchChange,
  };
}
