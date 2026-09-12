import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  const isLocal =
    connectionString?.includes("localhost") ||
    connectionString?.includes("127.0.0.1");

  return new Pool({
    connectionString,
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
  });
}

const pool = global._pgPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  global._pgPool = pool;
}

export default pool;
