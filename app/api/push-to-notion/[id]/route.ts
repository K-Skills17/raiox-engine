import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { pushAuditToNotion } from "@/lib/notion/push-audit";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = await createServiceClient();
  const { data: audit } = await serviceClient
    .from("audits")
    .select()
    .eq("id", params.id)
    .single();

  if (!audit) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (audit.notion_page_id) {
    return NextResponse.json({ error: "Already pushed" }, { status: 400 });
  }

  try {
    const notionPageId = await pushAuditToNotion(audit);

    await serviceClient
      .from("audits")
      .update({
        notion_page_id: notionPageId,
        status: "pushed_to_notion",
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id);

    return NextResponse.json({ notionPageId });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
