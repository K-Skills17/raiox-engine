import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: audits } = await supabase
    .from("audits")
    .select(
      "id, clinic_url, clinic_name, city, tier, best_reel_template, status, pagespeed_mobile, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  return NextResponse.json(audits || []);
}
