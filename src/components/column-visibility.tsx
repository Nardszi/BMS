"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Columns3, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ColumnVisibilityProps {
  columns: { key: string; label: string }[];
  defaultVisible?: string[];
  storageKey: string;
  onChange?: (visible: string[]) => void;
}

const STORAGE_PREFIX = "bms-columns-";

export function ColumnVisibility({ columns, defaultVisible, storageKey, onChange }: ColumnVisibilityProps) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_PREFIX + storageKey);
    const defaults = defaultVisible || columns.map((c) => c.key);
    setVisible(stored ? JSON.parse(stored) : defaults);
    setLoaded(true);
  }, [columns, defaultVisible, storageKey]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_PREFIX + storageKey, JSON.stringify(visible));
    onChange?.(visible);
  }, [visible, loaded, storageKey, onChange]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggleColumn(key: string) {
    setVisible((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  if (!loaded) return null;

  return (
    <div ref={wrapperRef} className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2"
      >
        <Columns3 className="h-4 w-4" />
        Columns
        <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px]">
          {visible.length}/{columns.length}
        </span>
      </Button>
      {open && (
        <div className="absolute right-0 z-50 mt-1 w-52 rounded-md border bg-white shadow-lg dark:bg-gray-900 dark:border-gray-700">
          <div className="border-b px-3 py-1.5 text-xs font-medium text-muted-foreground">
            Show/Hide Columns
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {columns.map((col) => (
              <button
                key={col.key}
                onClick={() => toggleColumn(col.key)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
              >
                <span
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded border",
                    visible.includes(col.key)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-gray-300 dark:border-gray-600"
                  )}
                >
                  {visible.includes(col.key) && <Check className="h-3 w-3" />}
                </span>
                {col.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1 border-t px-2 py-1.5">
            <button
              onClick={() => setVisible(columns.map((c) => c.key))}
              className="flex-1 rounded px-2 py-1 text-xs hover:bg-muted"
            >
              Show all
            </button>
            <button
              onClick={() => setVisible([])}
              className="flex-1 rounded px-2 py-1 text-xs hover:bg-muted"
            >
              Hide all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
