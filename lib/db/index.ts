import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const globalForDb = globalThis as unknown as {
    pool?: Pool;
};

const connectionString = process.env.DATABASE_URL ?? "";
// Neon exige SSL; una base local de desarrollo normalmente no lo tiene.
const isLocal = /@(localhost|127\.0\.0\.1)(:|\/)/.test(connectionString);

export const pool =
    globalForDb.pool ??
    new Pool({
        connectionString,
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 30000,
        ssl: isLocal ? false : { rejectUnauthorized: false },
    });

if (process.env.NODE_ENV !== "production") {
    globalForDb.pool = pool;
}

export const db = drizzle(pool);
