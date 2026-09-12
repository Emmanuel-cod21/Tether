import type { ExtractedTask } from "./gemini";

/**
 * Dev-only demo fixture: pass canvasToken === "demo" to skip the real Canvas
 * API entirely and get these back, so the Canvas tab can be demoed without a
 * real institution token. Gated to non-production so it can never be used
 * as a backdoor in a deployed app.
 */
const DEMO_CANVAS_TASKS: ExtractedTask[] = [
  { title: "COSC 4351: Software Design Group Project Milestone 2", due_at: "2026-09-22" },
  { title: "MATH 3321: Engineering Math Homework 6", due_at: "2026-09-26" },
  { title: "CS 3376: Programming Systems Assignment 3", due_at: "2026-10-01" },
  { title: "PHIL 1321: Reading Response 4", due_at: "2026-10-08" },
];

/**
 * Pulls active courses + their assignments from a user's Canvas LMS account
 * and maps them into the same {title, due_at} shape Gemini extraction
 * produces, so the rest of the commitment-creation flow doesn't care where
 * the tasks came from.
 *
 * `token` is a Canvas personal access token. It is used only for the two
 * fetch calls below and is never persisted or logged — the caller is
 * responsible for not storing it either.
 */
export async function fetchCanvasTasks(
  domain: string,
  token: string
): Promise<ExtractedTask[]> {
  if (process.env.NODE_ENV !== "production" && token === "demo") {
    return DEMO_CANVAS_TASKS;
  }

  const cleanDomain = domain.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  const headers = { Authorization: `Bearer ${token}` };

  let coursesRes: Response;
  try {
    coursesRes = await fetch(
      `https://${cleanDomain}/api/v1/courses?enrollment_state=active&per_page=100`,
      { headers, cache: "no-store" }
    );
  } catch {
    throw new Error("Invalid Canvas token or domain");
  }

  if (coursesRes.status === 401) {
    throw new Error("Invalid Canvas token or domain");
  }
  if (!coursesRes.ok) {
    throw new Error(`Canvas API error (${coursesRes.status})`);
  }

  const courses = await coursesRes.json();
  if (!Array.isArray(courses)) {
    throw new Error("Invalid Canvas token or domain");
  }

  const tasks: ExtractedTask[] = [];

  for (const course of courses) {
    if (!course?.id) continue;

    let assignmentsRes: Response;
    try {
      assignmentsRes = await fetch(
        `https://${cleanDomain}/api/v1/courses/${course.id}/assignments?order_by=due_at&per_page=100`,
        { headers, cache: "no-store" }
      );
    } catch {
      continue; // one course's network hiccup shouldn't kill the whole import
    }

    if (assignmentsRes.status === 401) {
      throw new Error("Invalid Canvas token or domain");
    }
    if (!assignmentsRes.ok) continue;

    const assignments = await assignmentsRes.json();
    if (!Array.isArray(assignments)) continue;

    const courseName: string =
      course.name || course.course_code || `Course ${course.id}`;

    for (const assignment of assignments) {
      if (typeof assignment?.due_at !== "string") continue;

      // Canvas returns full ISO 8601 UTC timestamps (e.g. "2026-09-20T04:59:59Z").
      // Take the date portion as-is rather than round-tripping through Date,
      // which would risk the same UTC-vs-local off-by-one this app already
      // had to fix for displayed due dates.
      const due_at = assignment.due_at.slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(due_at)) continue;

      tasks.push({
        title: `${courseName}: ${assignment.name ?? "Untitled assignment"}`,
        due_at,
      });
    }
  }

  return tasks;
}
