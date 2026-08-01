"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, History, X } from "lucide-react";
import { useRecentSearches } from "@/hooks/use-recent-searches";

interface SearchWithRecentsProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onSearch?: (term: string) => void;
}

export function SearchWithRecents({ value, onChange, placeholder, className, onSearch }: SearchWithRecentsProps) {
  const [focused, setFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { recentSearches, addSearch, removeSearch, clearSearches } = useRecentSearches();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelectTerm(term: string) {
    onChange(term);
    setFocused(false);
    onSearch?.(term);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && value.trim()) {
      addSearch(value.trim());
      onSearch?.(value.trim());
      setFocused(false);
    }
  }

  const showRecents = focused && recentSearches.length > 0 && !value;

  return (
    <div ref={wrapperRef} className="relative flex-1">
      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onKeyDown={handleKeyDown}
        className={`pl-9 ${className || ""}`}
      />
      {showRecents && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-white shadow-lg dark:bg-gray-900 dark:border-gray-700">
          <div className="flex items-center justify-between border-b px-3 py-1.5">
            <span className="text-xs font-medium text-muted-foreground">Recent Searches</span>
            <button
              onClick={() => { clearSearches(); setFocused(false); }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear all
            </button>
          </div>
          <div className="py-1">
            {recentSearches.map((term) => (
              <div
                key={term}
                className="group flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted cursor-pointer"
                onClick={() => handleSelectTerm(term)}
              >
                <History className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                <span className="flex-1 truncate">{term}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); removeSearch(term); }}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground"
                  aria-label={`Remove ${term} from recent searches`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
