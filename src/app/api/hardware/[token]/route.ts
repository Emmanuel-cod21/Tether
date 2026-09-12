import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

/**
 * Polled by the Raspberry Pi. Accepts either the owner_token or the
 * partner_token for the same commitment. Returns "missed" if ANY task
 * on that commitment currently has status = 'missed'.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const commitmentRes = await pool.query(
    "SELECT id FROM commitments WHERE owner_token = $1 OR partner_token = $1",
    [token]
  );
  if (commitmentRes.rowCount === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const commitmentId = commitmentRes.rows[0].id;

  const missedRes = await pool.query(
    "SELECT count(*)::int AS missed_count FROM tasks WHERE commitment_id = $1 AND status = 'missed'",
    [commitmentId]
  );
  const missedCount = missedRes.rows[0].missed_count;

  return NextResponse.json({
    status: missedCount > 0 ? "missed" : "ok",
    missedCount,
  });
}
