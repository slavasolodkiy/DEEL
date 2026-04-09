/**
 * Security tests for onboarding-engine session access control.
 *
 * Covers:
 *   - Anonymous session: missing token → 401
 *   - Anonymous session: wrong token → 401
 *   - Anonymous session: correct token → access granted
 *   - Authenticated session: wrong userId → 403
 *   - Authenticated session: correct userId → access granted
 *
 * These tests exercise `checkSessionAccess` logic directly via a thin harness
 * so no HTTP server is required.
 */

import { describe, it, expect } from "vitest";
import crypto from "crypto";
import type { Request, Response } from "express";

// ─── Inline reproduction of the checkSessionAccess logic ────────────────────
// (mirrors the logic in onboarding-engine.ts to allow pure-unit testing
//  without Express / DB dependencies)

type SessionRecord = {
  userId: number | null;
  sessionAccessTokenHash: string | null;
};

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function checkSessionAccess(
  req: Pick<Request, "user" | "headers">,
  res: Pick<Response, "status" | "json">,
  record: SessionRecord,
): boolean {
  if (record.userId !== null) {
    const reqUser = (req as { user?: { id: number } }).user;
    if (reqUser?.id !== record.userId) {
      res.status(403).json({ error: "forbidden", message: "You do not own this session" });
      return false;
    }
    return true;
  }

  const rawHeader = req.headers["x-onboarding-session-token"];
  const providedToken = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
  if (!providedToken) {
    res.status(401).json({
      error: "unauthorized",
      message: "X-Onboarding-Session-Token header is required for anonymous sessions",
    });
    return false;
  }

  if (!record.sessionAccessTokenHash || hashToken(providedToken) !== record.sessionAccessTokenHash) {
    res.status(401).json({ error: "unauthorized", message: "Invalid session access token" });
    return false;
  }

  return true;
}

// ─── Test helpers ────────────────────────────────────────────────────────────

function mockRes() {
  const res = {
    _status: 200,
    _body: {} as unknown,
    status(code: number) { this._status = code; return this; },
    json(body: unknown) { this._body = body; return this; },
  };
  return res;
}

function makeAnonymousSession(plainToken: string): SessionRecord {
  return { userId: null, sessionAccessTokenHash: hashToken(plainToken) };
}

function makeAuthenticatedSession(userId: number): SessionRecord {
  return { userId, sessionAccessTokenHash: null };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Anonymous onboarding session — token protection", () => {
  const correctToken = crypto.randomBytes(32).toString("hex");
  const wrongToken = crypto.randomBytes(32).toString("hex");
  const session = makeAnonymousSession(correctToken);

  it("rejects request with no X-Onboarding-Session-Token header (401)", () => {
    const req = { user: undefined, headers: {} } as Pick<Request, "user" | "headers">;
    const res = mockRes();
    const granted = checkSessionAccess(req, res as unknown as Response, session);
    expect(granted).toBe(false);
    expect(res._status).toBe(401);
    expect((res._body as { error?: string }).error).toBe("unauthorized");
  });

  it("rejects request with incorrect token (401)", () => {
    const req = {
      user: undefined,
      headers: { "x-onboarding-session-token": wrongToken },
    } as Pick<Request, "user" | "headers">;
    const res = mockRes();
    const granted = checkSessionAccess(req, res as unknown as Response, session);
    expect(granted).toBe(false);
    expect(res._status).toBe(401);
    expect((res._body as { message?: string }).message).toMatch(/Invalid session access token/);
  });

  it("allows request with the correct token", () => {
    const req = {
      user: undefined,
      headers: { "x-onboarding-session-token": correctToken },
    } as Pick<Request, "user" | "headers">;
    const res = mockRes();
    const granted = checkSessionAccess(req, res as unknown as Response, session);
    expect(granted).toBe(true);
    expect(res._status).toBe(200);
  });

  it("rejects even when an authenticated user presents a wrong token for an anonymous session", () => {
    const req = {
      user: { id: 99 },
      headers: { "x-onboarding-session-token": wrongToken },
    } as Pick<Request, "user" | "headers">;
    const res = mockRes();
    const granted = checkSessionAccess(req, res as unknown as Response, session);
    expect(granted).toBe(false);
    expect(res._status).toBe(401);
  });
});

describe("Authenticated onboarding session — ownership enforcement", () => {
  const ownerUserId = 7;
  const session = makeAuthenticatedSession(ownerUserId);

  it("rejects request from a different authenticated user (403)", () => {
    const req = { user: { id: 99 }, headers: {} } as Pick<Request, "user" | "headers">;
    const res = mockRes();
    const granted = checkSessionAccess(req, res as unknown as Response, session);
    expect(granted).toBe(false);
    expect(res._status).toBe(403);
    expect((res._body as { error?: string }).error).toBe("forbidden");
  });

  it("rejects unauthenticated request to an authenticated session (403)", () => {
    const req = { user: undefined, headers: {} } as Pick<Request, "user" | "headers">;
    const res = mockRes();
    const granted = checkSessionAccess(req, res as unknown as Response, session);
    expect(granted).toBe(false);
    expect(res._status).toBe(403);
  });

  it("allows the session owner to access", () => {
    const req = { user: { id: ownerUserId }, headers: {} } as Pick<Request, "user" | "headers">;
    const res = mockRes();
    const granted = checkSessionAccess(req, res as unknown as Response, session);
    expect(granted).toBe(true);
    expect(res._status).toBe(200);
  });
});

describe("Token hashing — correctness", () => {
  it("produces consistent SHA-256 hex hashes", () => {
    const token = "hello-world";
    expect(hashToken(token)).toBe(hashToken(token));
    expect(hashToken(token)).toHaveLength(64);
  });

  it("different tokens produce different hashes", () => {
    expect(hashToken("tokenA")).not.toBe(hashToken("tokenB"));
  });
});
