import { describe, it, expect } from "vitest";
import { formatDate, formatDateShort } from "@/lib/utils";

describe("formatDate", () => {
  it("formats a Date object", () => {
    const result = formatDate(new Date("2026-01-15"));
    expect(result).toContain("2026");
    expect(result).toContain("15");
  });

  it("formats a date string", () => {
    const result = formatDate("2026-06-28");
    expect(result).toContain("2026");
    expect(result).toContain("28");
  });
});

describe("formatDateShort", () => {
  it("formats a Date object to short format", () => {
    const result = formatDateShort(new Date("2026-01-05"));
    expect(result).toContain("2026");
    expect(result).toContain("01");
    expect(result).toContain("05");
  });

  it("formats a date string to short format", () => {
    const result = formatDateShort("2026-12-25");
    expect(result).toContain("2026");
    expect(result).toContain("12");
    expect(result).toContain("25");
  });
});
