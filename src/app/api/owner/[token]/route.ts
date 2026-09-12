import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const commitmentRes = await pool.query(
    "SELECT * FROM commitments WHERE owner_token = $1",
    [token]
  );
  if (commitmentRes.rowCount === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const commitment = commitmentRes.rows[0];

  const tasksRes = await pool.query(
    "SELECT * FROM tasks WHERE commitment_id = $1 ORDER BY due_at NULLS LAST, created_at",
    [commitment.id]
  );

  return NextResponse.json({ commitment, tasks: tasksRes.rows });
}
