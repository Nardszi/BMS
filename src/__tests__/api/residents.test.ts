import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth-helpers", () => ({
  requireAuth: vi.fn().mockResolvedValue({ id: "user-1", name: "Admin", role: "ADMIN" }),
  requireRole: vi.fn().mockResolvedValue({ id: "user-1", name: "Admin", role: "ADMIN" }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    resident: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn().mockResolvedValue({ id: "r-new", firstName: "Juan", lastName: "Cruz" }),
    },
    household: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "h-new", householdNumber: "H-001", purok: "1", address: "Test" }),
    },
    notification: { create: vi.fn() },
  },
}));

vi.mock("@/lib/audit", () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/notify", () => ({
  notifyUsersByRole: vi.fn().mockResolvedValue(undefined),
}));

import { GET, POST } from "@/app/api/residents/route";
import { requireAuth, requireRole } from "@/lib/auth-helpers";

function jsonRequest(url: string, body?: object, method = "GET"): Request {
  const init: RequestInit = body
    ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
    : { method };
  return new Request(url, init);
}

describe("GET /api/residents", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 200 with residents", async () => {
    const res = await GET(jsonRequest("http://localhost/api/residents?page=1&limit=15"));
    expect(res.status).toBe(200);
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(requireAuth).mockResolvedValueOnce(null);
    const res = await GET(jsonRequest("http://localhost/api/residents?page=1&limit=15"));
    expect(res.status).toBe(401);
  });
});

describe("POST /api/residents", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 403 when not authorized", async () => {
    vi.mocked(requireRole).mockResolvedValueOnce(null);
    const res = await POST(jsonRequest("http://localhost/api/residents", {
      firstName: "Juan", lastName: "Cruz", birthDate: "2000-01-01",
      gender: "MALE", civilStatus: "SINGLE", address: "Test", purok: "1",
      contactNumber: "0912-345-6789",
    }));
    expect(res.status).toBe(403);
  });

  it("returns 400 with missing fields", async () => {
    const res = await POST(jsonRequest("http://localhost/api/residents", {}));
    expect(res.status).toBe(400);
  });
});
