import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env["JWT_SECRET"] ??
  process.env["SESSION_SECRET"] ??
  "dev-secret-change-in-prod";

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

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
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
