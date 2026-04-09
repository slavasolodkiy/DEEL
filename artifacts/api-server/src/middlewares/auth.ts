import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import { authSessionsTable } from "@workspace/db/schema";
import { and, eq, gt } from "drizzle-orm";

// Fail fast at startup — do NOT allow a hardcoded fallback in any environment.
const _rawSecret = process.env["JWT_SECRET"] ?? process.env["SESSION_SECRET"];
if (!_rawSecret) {
  throw new Error(
    "FATAL: JWT_SECRET (or SESSION_SECRET) environment variable is required but not set. " +
      "Set it before starting the server.",
  );
}
export const JWT_SECRET: string = _rawSecret;

export interface AuthUser {
  id: number;
  email?: string;
  role?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * requireAuth — validates:
 *   1. Bearer token present
 *   2. JWT signature and expiry valid
 *   3. Session exists in DB
 *   4. Session is not revoked
 *   5. Session has not expired (expiresAt > now)
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "unauthorized", message: "Bearer token required" });
    return;
  }

  const token = authHeader.slice(7);
  let payload: { sub: number };
  try {
    payload = jwt.verify(token, JWT_SECRET) as unknown as { sub: number };
  } catch {
    res.status(401).json({ error: "unauthorized", message: "Invalid or expired token" });
    return;
  }

  const [session] = await db
    .select()
    .from(authSessionsTable)
    .where(
      and(
        eq(authSessionsTable.token, token),
        eq(authSessionsTable.isRevoked, false),
        gt(authSessionsTable.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!session) {
    res.status(401).json({ error: "unauthorized", message: "Session not found, revoked, or expired" });
    return;
  }

  req.user = { id: payload.sub };
  next();
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const payload = jwt.verify(token, JWT_SECRET) as unknown as { sub: number };
      req.user = { id: payload.sub };
    } catch {
      // ignore — optional auth means unauthenticated is fine
    }
  }
  next();
}

export function requireScimToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], status: "401" });
    return;
  }
  const token = authHeader.replace(/^Bearer\s+/i, "");

  const scimToken = process.env["SCIM_TOKEN"];
  if (scimToken) {
    if (token !== scimToken) {
      res.status(401).json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], status: "401" });
      return;
    }
    next();
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as unknown as { sub: number };
    req.user = { id: payload.sub };
    next();
  } catch {
    res.status(401).json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], status: "401" });
  }
}
