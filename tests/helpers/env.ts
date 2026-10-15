import { readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "dotenv";

/** Values from the project's .env (read only; never written or logged). */
export function projectEnv(): Record<string, string> {
  try {
    return parse(readFileSync(path.join(process.cwd(), ".env")));
  } catch {
    return {};
  }
}

/** Same server as the dev database, but the separate `motovo_test` database so tests never touch real data. */
export function testDatabaseUrl(): string {
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;
  const url = new URL(process.env.DATABASE_URL ?? projectEnv().DATABASE_URL ?? "postgresql://motovo:motovo@localhost:5434/motovo");
  url.pathname = "/motovo_test";
  // never let tests (which TRUNCATE tables) reach a remote server, e.g. when .env points at production
  if (!["localhost", "127.0.0.1", "::1"].includes(url.hostname)) {
    throw new Error(`Refusing to run tests against ${url.hostname}. Point DATABASE_URL at the local database or set TEST_DATABASE_URL.`);
  }
  return url.toString();
}
