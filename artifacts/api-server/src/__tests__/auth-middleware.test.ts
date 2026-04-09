/**
 * Security tests for requireAuth middleware.
 *
 * Covers:
 *   - Missing / malformed Bearer token → 401
 *   - Invalid or expired JWT → 401
 *   - Session not found in DB → 401
 *   - Session is revoked (isRevoked = true) → 401
 *   - Session is expired (expiresAt <= now) → 401
 *   - Valid JWT + live session → passes through (next called)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const TEST_SECRET = "test-secret-for-unit-tests-only";

// Stub process.env before the module under test is loaded so the fail-fast
// check finds a value and doesn't throw.
vi.stubEnv("JWT_SECRET", TEST_SECRET);

// Mock @workspace/db so no real DB is needed in unit tests.
vi.mock("@workspace/db", () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock("@workspace/db/schema", () => ({
  authSessionsTable: { id: "id", userId: "userId", token: "token", isRevoked: "isRevoked", expiresAt: "expiresAt" },
}));

vi.mock("drizzle-orm", () => ({
  and: (...args: unknown[]) => ({ _and: args }),
  eq: (col: unknown, val: unknown) => ({ _eq: [col, val] }),
  gt: (col: unknown, val: unknown) => ({ _gt: [col, val] }),
}));

// Helper: create a minimal mock request
function mockReq(token?: string): Request {
  return {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  } as unknown as Request;
}

// Helper: create a mock response that captures status + json
function mockRes() {
  const res = {
    _status: 0,
    _body: {} as unknown,
    status(code: number) { this._status = code; return this; },
    json(body: unknown) { this._body = body; return this; },
  };
  return res as typeof res & Pick<Response, "status" | "json">;
}

async function importMiddleware() {
  // Dynamic import ensures env stub is applied first
  const mod = await import("../middlewares/auth.js");
  return mod.requireAuth;
}

// Build the DB mock to return a specific session row (or empty)
async function setupDbMock(session: Record<string, unknown> | null) {
  const { db } = await import("@workspace/db");
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(session ? [session] : []),
  };
  (db.select as ReturnType<typeof vi.fn>).mockReturnValue(chain);
  return chain;
}

const validToken = jwt.sign({ sub: 42 }, TEST_SECRET, { expiresIn: "1h" });
const expiredJwt = jwt.sign({ sub: 42 }, TEST_SECRET, { expiresIn: "-1s" });

describe("requireAuth middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects request with no Authorization header (401)", async () => {
    const requireAuth = await importMiddleware();
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();
    await requireAuth(req as Request, res as unknown as Response, next as NextFunction);
    expect(res._status).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects request with invalid JWT (401)", async () => {
    const requireAuth = await importMiddleware();
    const req = mockReq("not.a.valid.token");
    const res = mockRes();
    const next = vi.fn();
    await requireAuth(req as Request, res as unknown as Response, next as NextFunction);
    expect(res._status).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects request with expired JWT (401)", async () => {
    const requireAuth = await importMiddleware();
    const req = mockReq(expiredJwt);
    const res = mockRes();
    const next = vi.fn();
    await requireAuth(req as Request, res as unknown as Response, next as NextFunction);
    expect(res._status).toBe(401);
    expect((res._body as { message?: string }).message).toMatch(/Invalid or expired/);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects when session is not found in DB (401)", async () => {
    await setupDbMock(null);
    const requireAuth = await importMiddleware();
    const req = mockReq(validToken);
    const res = mockRes();
    const next = vi.fn();
    await requireAuth(req as Request, res as unknown as Response, next as NextFunction);
    expect(res._status).toBe(401);
    expect((res._body as { message?: string }).message).toMatch(/revoked|expired|not found/i);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects when session is revoked (isRevoked = true → DB returns no rows) (401)", async () => {
    // The WHERE clause already filters isRevoked=false, so a revoked session returns no rows.
    await setupDbMock(null);
    const requireAuth = await importMiddleware();
    const req = mockReq(validToken);
    const res = mockRes();
    const next = vi.fn();
    await requireAuth(req as Request, res as unknown as Response, next as NextFunction);
    expect(res._status).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects when session is expired (expiresAt <= now → DB returns no rows) (401)", async () => {
    // The WHERE clause already filters expiresAt > now, so an expired session returns no rows.
    await setupDbMock(null);
    const requireAuth = await importMiddleware();
    const req = mockReq(validToken);
    const res = mockRes();
    const next = vi.fn();
    await requireAuth(req as Request, res as unknown as Response, next as NextFunction);
    expect(res._status).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("passes through when JWT is valid and session is live in DB", async () => {
    const liveSession = {
      id: 1,
      userId: 42,
      token: validToken,
      isRevoked: false,
      expiresAt: new Date(Date.now() + 3600_000),
    };
    await setupDbMock(liveSession);
    const requireAuth = await importMiddleware();
    const req = mockReq(validToken) as Request & { user?: { id: number } };
    const res = mockRes();
    const next = vi.fn();
    await requireAuth(req as Request, res as unknown as Response, next as NextFunction);
    expect(next).toHaveBeenCalled();
    expect(req.user?.id).toBe(42);
  });
});
