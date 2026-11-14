import "server-only";
import postgres from "postgres";

/** One pooled client per server instance. DATABASE_URL is read from the environment (see .env.example). */
const g = globalThis as unknown as { __jernihSql?: postgres.Sql };
export function sql(): postgres.Sql {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL belum diatur");
  g.__jernihSql ??= postgres(process.env.DATABASE_URL, { max: 5, idle_timeout: 20, prepare: false });
  return g.__jernihSql;
}
