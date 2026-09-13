import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import pool from "@/lib/db";
import { extractTasks, GeminiExtractionError, type ExtractedTask } from "@/lib/gemini";
import { fetchCanvasTasks } from "@/lib/canvas";
import { fetchSlackTasks } from "@/lib/slack";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    rawText,
    partnerName,
    partnerEmail,
    canvasDomain,
    canvasToken,
    slackSourceToken,
  } = body as {
    rawText?: string;
    partnerName?: string;
    partnerEmail?: string;
    canvasDomain?: string;
    canvasToken?: string;
    slackSourceToken?: string;
  };

  const usingCanvas = !!(canvasDomain && canvasToken);
  const usingSlack = !!slackSourceToken;

  if (
    !usingCanvas &&
    !usingSlack &&
    (!rawText || typeof rawText !== "string" || !rawText.trim())
  ) {
    return NextResponse.json({ error: "rawText is required" }, { status: 400 });
  }

  let tasks: ExtractedTask[];
  if (usingCanvas) {
    // canvasDomain/canvasToken live only in these locals for the duration of
    // this request — never written to the database or logged.
    try {
      tasks = await fetchCanvasTasks(canvasDomain, canvasToken);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch Canvas tasks";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  } else if (usingSlack) {
    // slackSourceToken lives only in this local for the duration of this
    // request — never written to the database or logged.
    try {
      tasks = await fetchSlackTasks(slackSourceToken);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch Slack tasks";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  } else {
    try {
      tasks = await extractTasks(rawText!);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to extract tasks";
      const status =
        err instanceof GeminiExtractionError && err.status === 429 ? 429 : 502;
      return NextResponse.json({ error: message }, { status });
    }
  }

  const ownerToken = nanoid(10);
  const partnerToken = nanoid(10);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const commitmentRes = await client.query(
      `INSERT INTO commitments (owner_token, partner_token, partner_name, partner_email)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [ownerToken, partnerToken, partnerName || null, partnerEmail || null]
    );
    const commitmentId = commitmentRes.rows[0].id;

    for (const t of tasks) {
      await client.query(
        `INSERT INTO tasks (commitment_id, title, due_at) VALUES ($1, $2, $3)`,
        [commitmentId, t.title, t.due_at]
      );
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("create commitment failed:", err);
    return NextResponse.json({ error: "failed to create" }, { status: 500 });
  } finally {
    client.release();
  }

  return NextResponse.json({ ownerToken, partnerToken, taskCount: tasks.length });
}
