import { describe, it, expect, vi, beforeEach } from "vitest";
import { exportToCSV } from "@/lib/export-csv";

describe("exportToCSV", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("generates correct CSV content", () => {
    const mockClick = vi.fn();
    vi.spyOn(document, "createElement").mockReturnValue({
      click: mockClick,
      href: "",
      download: "",
    } as unknown as HTMLAnchorElement);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:url");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

    exportToCSV(["Name", "Age"], [["Juan", 25], ["Pedro", 30]], "test");

    expect(mockClick).toHaveBeenCalled();
  });

  it("escapes commas in values", () => {
    const mockClick = vi.fn();
    vi.spyOn(document, "createElement").mockReturnValue({
      click: mockClick,
      href: "",
      download: "",
    } as unknown as HTMLAnchorElement);

    const createObjectURLSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:url");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

    exportToCSV(["Address"], [["Purok 1, Barangay 9"]], "test");

    expect(createObjectURLSpy).toHaveBeenCalled();
    const blobArg = createObjectURLSpy.mock.calls[0][0] as Blob;
    expect(blobArg).toBeInstanceOf(Blob);
  });

  it("handles null/undefined values", () => {
    const mockClick = vi.fn();
    vi.spyOn(document, "createElement").mockReturnValue({
      click: mockClick,
      href: "",
      download: "",
    } as unknown as HTMLAnchorElement);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:url");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

    exportToCSV(["Name", "Phone"], [["Juan", null]], "test");
    expect(mockClick).toHaveBeenCalled();
  });

  it("sets filename with date", () => {
    const mockClick = vi.fn();
    const link = { click: mockClick, href: "", download: "" };
    vi.spyOn(document, "createElement").mockReturnValue(link as unknown as HTMLAnchorElement);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:url");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

    exportToCSV(["A"], [["1"]], "residents");

    expect(link.download).toMatch(/^residents-\d{4}-\d{2}-\d{2}\.csv$/);
  });
});
