// Creates (if needed) and migrates the test database. Reads .env but never modifies or prints it.
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { parse } from "dotenv";

let env = {};
try { env = parse(readFileSync(".env")); } catch {}
const base = new URL(process.env.DATABASE_URL ?? env.DATABASE_URL ?? "postgresql://motovo:motovo@localhost:5434/motovo");
const test = new URL(base); test.pathname = "/motovo_test";
const url = process.env.TEST_DATABASE_URL ?? test.toString();
execSync("npx prisma migrate deploy", { stdio: "inherit", env: { ...process.env, DATABASE_URL: url } });
