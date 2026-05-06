import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = await createServiceClient();
  const { data: audits } = await serviceClient
    .from("audits")
    .select(
      "id, clinic_url, clinic_name, city, tier, best_reel_template, status, pagespeed_mobile, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  return NextResponse.json(audits || []);
}
