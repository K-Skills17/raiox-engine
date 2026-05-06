import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated, OWNER_USER_ID } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { runFullAudit } from "@/lib/pipeline/orchestrator";

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { urls, city, tier } = body as {
    urls: string[];
    city?: string;
    tier?: number;
  };

  if (!urls || urls.length === 0 || urls.length > 20) {
    return NextResponse.json(
      { error: "Provide 1-20 URLs" },
      { status: 400 }
    );
  }

  const serviceClient = await createServiceClient();
  const { data: batch, error: batchError } = await serviceClient
    .from("batch_runs")
    .insert({
      url_count: urls.length,
      status: "running",
      created_by: OWNER_USER_ID,
    })
    .select()
    .single();

  if (batchError || !batch) {
    return NextResponse.json(
      { error: "Failed to create batch" },
      { status: 500 }
    );
  }

  processAudits(batch.id, urls, city, tier);

  return NextResponse.json({ batchId: batch.id });
}

async function processAudits(
  batchId: string,
  urls: string[],
  city?: string,
  tier?: number
) {
  const serviceClient = await createServiceClient();
  const auditIds: string[] = [];
  let completedCount = 0;
  let failedCount = 0;

  const CONCURRENCY = 5;
  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    const chunk = urls.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      chunk.map((url) => runFullAudit(url, OWNER_USER_ID, { city, tier }))
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        auditIds.push(result.value);
        completedCount++;
      } else {
        auditIds.push("");
        failedCount++;
        console.error("Audit failed:", result.reason);
      }
    }

    await serviceClient
      .from("batch_runs")
      .update({
        completed_count: completedCount,
        failed_count: failedCount,
        audit_ids: auditIds.filter(Boolean),
      })
      .eq("id", batchId);
  }

  const finalStatus =
    failedCount === urls.length
      ? "failed"
      : failedCount > 0
        ? "partial"
        : "complete";

  await serviceClient
    .from("batch_runs")
    .update({
      status: finalStatus,
      completed_count: completedCount,
      failed_count: failedCount,
      audit_ids: auditIds.filter(Boolean),
    })
    .eq("id", batchId);
}

export async function GET(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const batchId = req.nextUrl.searchParams.get("id");
  if (!batchId) {
    return NextResponse.json({ error: "Missing batch id" }, { status: 400 });
  }

  const serviceClient = await createServiceClient();
  const { data: batch } = await serviceClient
    .from("batch_runs")
    .select()
    .eq("id", batchId)
    .single();

  if (!batch) {
    return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  }

  return NextResponse.json(batch);
}
