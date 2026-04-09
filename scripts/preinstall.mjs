#!/usr/bin/env node
/**
 * Cross-platform preinstall guard.
 * Ensures the workspace is installed with pnpm, not npm or yarn.
 */
const agent = process.env["npm_config_user_agent"] ?? "";
if (!agent.startsWith("pnpm/")) {
  process.stderr.write(
    "ERROR: This workspace must be installed with pnpm.\n" +
      "Run: pnpm install\n",
  );
  process.exit(1);
}

const lockfiles = ["package-lock.json", "yarn.lock"];
const { unlink } = await import("node:fs/promises");
for (const f of lockfiles) {
  try {
    await unlink(f);
  } catch {
    // file doesn't exist — that's fine
  }
}
