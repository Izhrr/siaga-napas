import { connection, NextResponse } from "next/server";
import { getConversation } from "@/server/store";

export async function GET(_req: Request, ctx: RouteContext<"/api/chat/conversations/[id]">) {
  await connection();
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "id tidak valid" }, { status: 400 });
  try { return NextResponse.json({ id, messages: await getConversation(id) }); }
  catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 500 }); }
}
