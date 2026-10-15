import { testDatabaseUrl } from "./env";

// Every test process talks to the throw-away test database, never the dev one.
process.env.DATABASE_URL = testDatabaseUrl();
process.env.AUTH_SECRET ||= "test-secret-test-secret-test-secret";
process.env.SITE_URL = "http://test.local";
// never touch the real photo bucket from tests
for (const k of ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET", "R2_PUBLIC_URL", "R2_ENDPOINT"]) delete process.env[k];
