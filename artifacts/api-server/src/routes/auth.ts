import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import { usersTable, authSessionsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET ?? process.env.SESSION_SECRET ?? "dev-secret-change-in-prod";
const TOKEN_TTL_HOURS = 24;

function signToken(userId: number): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: `${TOKEN_TTL_HOURS}h` });
}

function userPublic(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    locale: user.locale,
    isVerified: user.isVerified,
  };
}

async function storeSession(userId: number, token: string): Promise<void> {
  const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000);
  await db.insert(authSessionsTable).values({ userId, token, expiresAt });
}

// POST /api/auth/register
router.post("/auth/register", async (req, res): Promise<void> => {
  const { email, password, role = "individual", locale = "en" } = req.body as {
    email?: string;
    password?: string;
    role?: string;
    locale?: string;
  };

  if (!email || !password) {
    res.status(400).json({ error: "validation", message: "email and password are required" });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "validation", message: "password must be at least 8 characters" });
    return;
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "conflict", message: "email already in use" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db.insert(usersTable).values({ email, passwordHash, role, locale }).returning();
  const token = signToken(user!.id);
  await storeSession(user!.id, token);

  res.status(201).json({ token, user: userPublic(user!) });
});

// POST /api/auth/login
router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: "validation", message: "email and password are required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user || !user.passwordHash) {
    res.status(401).json({ error: "unauthorized", message: "invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "unauthorized", message: "invalid credentials" });
    return;
  }

  const token = signToken(user.id);
  await storeSession(user.id, token);
  res.json({ token, user: userPublic(user) });
});

// POST /api/auth/logout
router.post("/auth/logout", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    await db.update(authSessionsTable).set({ isRevoked: true }).where(eq(authSessionsTable.token, token));
  }
  res.status(204).send();
});

// GET /api/auth/me
router.get("/auth/me", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "unauthorized", message: "no token provided" });
    return;
  }

  const token = authHeader.slice(7);
  let payload: { sub: number };
  try {
    payload = jwt.verify(token, JWT_SECRET) as { sub: number };
  } catch {
    res.status(401).json({ error: "unauthorized", message: "invalid or expired token" });
    return;
  }

  const [session] = await db
    .select()
    .from(authSessionsTable)
    .where(eq(authSessionsTable.token, token))
    .limit(1);

  if (!session || session.isRevoked) {
    res.status(401).json({ error: "unauthorized", message: "session revoked or not found" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.sub)).limit(1);
  if (!user) {
    res.status(401).json({ error: "unauthorized", message: "user not found" });
    return;
  }

  res.json(userPublic(user));
});

// GET /api/auth/oauth/:provider — mock OAuth (returns a test user immediately)
router.get("/auth/oauth/:provider", async (req, res): Promise<void> => {
  const { provider } = req.params as { provider: string };
  const email = `demo+${provider}@globalhr-platform.dev`;

  let [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) {
    [user] = await db
      .insert(usersTable)
      .values({
        email,
        role: "individual",
        oauthProvider: provider,
        oauthProviderId: `mock-${provider}-uid-1`,
        isVerified: true,
      })
      .returning();
  }

  const token = signToken(user!.id);
  await storeSession(user!.id, token);
  res.json({ token, user: userPublic(user!), note: `Mock OAuth login via ${provider}` });
});

// POST /api/auth/sso/callback — mock SAML/OIDC SSO adapter
router.post("/auth/sso/callback", async (req, res): Promise<void> => {
  const { email, firstName, lastName, organizationId, provider = "saml" } = req.body as {
    email?: string;
    firstName?: string;
    lastName?: string;
    organizationId?: string;
    provider?: string;
  };

  if (!email) {
    res.status(400).json({ error: "validation", message: "email is required for SSO callback" });
    return;
  }

  let [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) {
    [user] = await db
      .insert(usersTable)
      .values({
        email,
        firstName: firstName ?? null,
        lastName: lastName ?? null,
        role: "business",
        oauthProvider: provider,
        ssoOrganizationId: organizationId ?? null,
        isVerified: true,
      })
      .returning();
  } else {
    await db
      .update(usersTable)
      .set({ firstName: firstName ?? user.firstName, lastName: lastName ?? user.lastName })
      .where(eq(usersTable.id, user.id));
    user = { ...user, firstName: firstName ?? user.firstName, lastName: lastName ?? user.lastName };
  }

  const token = signToken(user!.id);
  await storeSession(user!.id, token);
  res.json({ token, user: userPublic(user!), note: "Mock SSO/SAML login — no real SAML XML processed in this adapter" });
});

// ─── SCIM 2.0 Mock Adapter ─────────────────────────────────────────────────
const SCIM_SCHEMAS = ["urn:ietf:params:scim:schemas:core:2.0:User"];

function toSCIMUser(user: typeof usersTable.$inferSelect) {
  return {
    schemas: SCIM_SCHEMAS,
    id: String(user.id),
    userName: user.email,
    name: { givenName: user.firstName ?? "", familyName: user.lastName ?? "" },
    emails: [{ value: user.email, primary: true }],
    active: true,
    meta: { resourceType: "User" },
  };
}

// GET /api/auth/scim/v2/Users
router.get("/auth/scim/v2/Users", async (req, res): Promise<void> => {
  const startIndex = Number(req.query["startIndex"] ?? 1);
  const count = Math.min(Number(req.query["count"] ?? 20), 100);
  const users = await db.select().from(usersTable).limit(count).offset(startIndex - 1);
  const totalResults = users.length;
  res.json({
    schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
    totalResults,
    startIndex,
    itemsPerPage: count,
    Resources: users.map(toSCIMUser),
  });
});

// POST /api/auth/scim/v2/Users
router.post("/auth/scim/v2/Users", async (req, res): Promise<void> => {
  const body = req.body as { userName?: string; name?: { givenName?: string; familyName?: string }; active?: boolean };
  const email = body.userName;
  if (!email) {
    res.status(400).json({ error: "validation", message: "userName (email) is required" });
    return;
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing[0]) {
    res.status(409).json({ error: "conflict", message: "User already exists" });
    return;
  }

  const [user] = await db
    .insert(usersTable)
    .values({
      email,
      firstName: body.name?.givenName ?? null,
      lastName: body.name?.familyName ?? null,
      role: "individual",
      oauthProvider: "scim",
      isVerified: true,
    })
    .returning();

  res.status(201).json(toSCIMUser(user!));
});

// GET /api/auth/scim/v2/Users/:id
router.get("/auth/scim/v2/Users/:id", async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!user) {
    res.status(404).json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], status: "404" });
    return;
  }
  res.json(toSCIMUser(user));
});

// PATCH /api/auth/scim/v2/Users/:id
router.patch("/auth/scim/v2/Users/:id", async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);
  const body = req.body as { Operations?: Array<{ op: string; path?: string; value?: unknown }> };
  const ops = body.Operations ?? [];

  let [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!user) {
    res.status(404).json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], status: "404" });
    return;
  }

  const updates: Partial<typeof usersTable.$inferInsert> = {};
  for (const op of ops) {
    if (op.op === "replace" && op.path === "active" && op.value === false) {
      updates.isVerified = false;
    }
  }
  if (Object.keys(updates).length > 0) {
    await db.update(usersTable).set(updates).where(eq(usersTable.id, id));
    [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  }
  res.json(toSCIMUser(user!));
});

// DELETE /api/auth/scim/v2/Users/:id
router.delete("/auth/scim/v2/Users/:id", async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);
  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.status(204).send();
});

export default router;
