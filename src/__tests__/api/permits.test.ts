import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth-helpers", () => ({
  requireAuth: vi.fn().mockResolvedValue({ id: "user-1", name: "Admin", role: "ADMIN" }),
  requireRole: vi.fn().mockResolvedValue({ id: "user-1", name: "Admin", role: "ADMIN" }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    businessPermit: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "p-new", permitNumber: "BP-2026-ABC123", businessName: "Test Store" }),
      update: vi.fn().mockResolvedValue({ id: "p1", status: "ACTIVE" }),
      delete: vi.fn().mockResolvedValue({ id: "p1" }),
    },
    resident: { findUnique: vi.fn().mockResolvedValue({ id: "r1", firstName: "Juan" }) },
  },
}));

vi.mock("@/lib/audit", () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/notify", () => ({
  notifyUsersByRole: vi.fn().mockResolvedValue(undefined),
}));

import { GET, POST } from "@/app/api/permits/route";
import { PUT, DELETE } from "@/app/api/permits/[id]/route";
import { requireAuth, requireRole } from "@/lib/auth-helpers";

function jsonRequest(url: string, body?: object, method = "GET"): Request {
  const init: RequestInit = body
    ? { method: method === "GET" ? "POST" : method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
    : { method };
  return new Request(url, init);
}

describe("GET /api/permits", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 200 with permits", async () => {
    const res = await GET(jsonRequest("http://localhost/api/permits"));
    expect(res.status).toBe(200);
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(requireAuth).mockResolvedValueOnce(null);
    const res = await GET(jsonRequest("http://localhost/api/permits"));
    expect(res.status).toBe(401);
  });
});

describe("POST /api/permits", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 403 when not authorized", async () => {
    vi.mocked(requireRole).mockResolvedValueOnce(null);
    const res = await POST(jsonRequest("http://localhost/api/permits", {
      businessName: "Test Store", ownerResidentId: "r1", businessType: "Sari-Sari Store",
      address: "123 Main St", issueDate: "2026-01-01", expiryDate: "2027-01-01",
    }));
    expect(res.status).toBe(403);
  });
});

describe("DELETE /api/permits/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 403 when not admin", async () => {
    vi.mocked(requireRole).mockResolvedValueOnce(null);
    const req = new Request("http://localhost/api/permits/p1", { method: "DELETE" });
    const res = await DELETE(req, { params: { id: "p1" } });
    expect(res.status).toBe(403);
  });
});
