// Jalankan perintah dengan DATABASE_URL dari CONNECTION_STRING di web/.env tanpa mencetak nilainya.
// Pakai (dari folder web): node scripts/with-supabase.mjs session -- <perintah...>
import nextEnv from "@next/env";
import { spawnSync } from "node:child_process";
nextEnv.loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
const raw = process.env.CONNECTION_STRING || process.env.DATABASE_URL;
if (!raw) { console.error("CONNECTION_STRING / DATABASE_URL tidak ditemukan di web/.env"); process.exit(2); }
const mode = process.argv[2];
let url = raw.trim().replace(/^["']|["']$/g, "");
const u = new URL(url);
if (mode === "tx") u.port = "6543";
if (!u.searchParams.has("sslmode")) u.searchParams.set("sslmode", "require");
console.error(`[with-sb] host=${u.hostname} port=${u.port} user=${decodeURIComponent(u.username).replace(/\..*/, ".<ref>")} db=${u.pathname.slice(1)} sslmode=${u.searchParams.get("sslmode")}`);
const cmd = process.argv.slice(process.argv.indexOf("--") + 1);
const r = spawnSync(cmd[0], cmd.slice(1), { stdio: "inherit", env: { ...process.env, DATABASE_URL: u.toString() } });
process.exit(r.status ?? 1);
