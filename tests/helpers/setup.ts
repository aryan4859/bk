import { testDatabaseUrl } from "./env";

// Every test process talks to the throw-away test database, never the dev one.
process.env.DATABASE_URL = testDatabaseUrl();
process.env.AUTH_SECRET ||= "test-secret-test-secret-test-secret";
process.env.SITE_URL = "http://test.local";
