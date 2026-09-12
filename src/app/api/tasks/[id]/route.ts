import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { craftNotification } from "@/lib/gemini";
import { sendAccountabilityEmail } from "@/lib/email";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { status } = (await req.json()) as { status?: string };

  if (!status || !["pending", "done", "missed"].includes(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }

  const taskRes = await pool.query(
    "UPDATE tasks SET status = $1, updated_at = now() WHERE id = $2 RETURNING *",
    [status, id]
  );
  if (taskRes.rowCount === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const task = taskRes.rows[0];

  const commitmentRes = await pool.query(
    "SELECT * FROM commitments WHERE id = $1",
    [task.commitment_id]
  );
  const commitment = commitmentRes.rows[0];

  if ((status === "done" || status === "missed") && commitment?.partner_email) {
    const message = await craftNotification(
      task.title,
      status,
      "Your accountability partner"
    );
    const partnerLink = `${process.env.NEXT_PUBLIC_BASE_URL || ""}/t/${commitment.partner_token}`;

    await sendAccountabilityEmail(
      commitment.partner_email,
      status === "done" ? `✅ Task completed: ${task.title}` : `⚠️ Task missed: ${task.title}`,
      message,
      partnerLink
    );
  }

  return NextResponse.json({ task });
}
