import type { ExtractedTask } from "./gemini";

/**
 * Dev-only demo fixture: pass slackToken === "demo" to skip the real Slack
 * API entirely and get these back, so the Slack tab can be demoed without a
 * real workspace token. Gated to non-production so it can never be used as
 * a backdoor in a deployed app.
 */
const DEMO_SLACK_TASKS: ExtractedTask[] = [
  { title: "Follow up with design team on mockups", due_at: "2026-09-19" },
  { title: "Submit Q3 budget draft", due_at: "2026-09-25" },
  { title: "Review pull request from Priya", due_at: "2026-09-23" },
  { title: "Prep slides for Monday standup", due_at: "2026-09-28" },
];

/**
 * Pulls a user's Slack reminders and maps them into the same
 * {title, due_at} shape Gemini extraction produces, so the rest of the
 * commitment-creation flow doesn't care where the tasks came from.
 *
 * `slackToken` is a Slack User OAuth Token. It is used only for the fetch
 * call below and is never persisted or logged — the caller is responsible
 * for not storing it either.
 */
export async function fetchSlackTasks(
  slackToken: string
): Promise<ExtractedTask[]> {
  if (process.env.NODE_ENV !== "production" && slackToken === "demo") {
    return DEMO_SLACK_TASKS;
  }

  let res: Response;
  try {
    res = await fetch("https://slack.com/api/reminders.list", {
      headers: { Authorization: `Bearer ${slackToken}` },
      cache: "no-store",
    });
  } catch {
    throw new Error("Invalid Slack token");
  }

  if (!res.ok) {
    throw new Error(`Slack API error (${res.status})`);
  }

  const data = await res.json();

  // Slack's Web API always returns 200 and signals failure via `ok: false`
  // plus an `error` code (e.g. "invalid_auth", "token_revoked", "missing_scope").
  if (!data.ok) {
    throw new Error(
      data.error === "invalid_auth" || data.error === "token_revoked"
        ? "Invalid or expired Slack token"
        : `Slack API error: ${data.error ?? "unknown_error"}`
    );
  }

  const reminders = Array.isArray(data.reminders) ? data.reminders : [];

  return reminders.map((reminder: { text?: string; time?: number }) => ({
    title: reminder.text ?? "Untitled reminder",
    due_at:
      typeof reminder.time === "number"
        ? new Date(reminder.time * 1000).toISOString().slice(0, 10)
        : null,
  }));
}
