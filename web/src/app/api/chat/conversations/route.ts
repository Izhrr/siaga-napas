import { connection, NextResponse } from "next/server";
import { listConversations } from "@/server/store";

export async function GET() {
  await connection();
  try { return NextResponse.json(await listConversations()); }
  catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 500 }); }
}
