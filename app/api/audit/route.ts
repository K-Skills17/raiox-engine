import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated, OWNER_USER_ID } from "@/lib/auth";
import { runFullAudit } from "@/lib/pipeline/orchestrator";

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { url, city, tier } = body as {
    url: string;
    city?: string;
    tier?: number;
  };

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    const auditId = await runFullAudit(url, OWNER_USER_ID, { city, tier });
    return NextResponse.json({ auditId });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
