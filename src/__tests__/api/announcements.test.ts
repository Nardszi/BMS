import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth-helpers", () => ({
  requireAuth: vi.fn().mockResolvedValue({ id: "user-1", name: "Admin", email: "admin@test.com", role: "ADMIN" }),
  requireRole: vi.fn().mockResolvedValue({ id: "user-1", name: "Admin", email: "admin@test.com", role: "ADMIN" }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    announcement: {
      findMany: vi.fn().mockResolvedValue([
        { id: "a1", title: "Test Announcement", content: "Content", priority: "GENERAL", category: "GENERAL", pinned: false, createdAt: new Date(), postedBy: { name: "Admin" } },
      ]),
      create: vi.fn().mockResolvedValue({ id: "a-new", title: "New Announcement", content: "Body", priority: "GENERAL", category: "GENERAL", pinned: false, createdAt: new Date(), postedBy: { name: "Admin" } }),
    },
  },
}));

vi.mock("@/lib/audit", () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

import { GET, POST } from "@/app/api/announcements/route";
import { requireAuth, requireRole } from "@/lib/auth-helpers";

function jsonRequest(url: string, body?: object): Request {
  const init: RequestInit = body
    ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
    : { method: "GET" };
  return new Request(url, init);
}

describe("GET /api/announcements", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 200 with announcements", async () => {
    const res = await GET(jsonRequest("http://localhost/api/announcements"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(requireAuth).mockResolvedValueOnce(null);
    const res = await GET(jsonRequest("http://localhost/api/announcements"));
    expect(res.status).toBe(401);
  });
});

describe("POST /api/announcements", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates an announcement with valid data", async () => {
    const res = await POST(jsonRequest("http://localhost/api/announcements", {
      title: "Test",
      content: "Some content here",
      priority: "GENERAL",
      category: "GENERAL",
    }));
    expect(res.status).toBe(201);
  });

  it("returns 403 when not authorized", async () => {
    vi.mocked(requireRole).mockResolvedValueOnce(null);
    const res = await POST(jsonRequest("http://localhost/api/announcements", {
      title: "Test",
      content: "Body",
      priority: "GENERAL",
      category: "GENERAL",
    }));
    expect(res.status).toBe(403);
  });

  it("returns 400 with invalid data", async () => {
    const res = await POST(jsonRequest("http://localhost/api/announcements", {
      title: "",
    }));
    expect(res.status).toBe(400);
  });
});
