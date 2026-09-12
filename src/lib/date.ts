/**
 * `due_at` values are TIMESTAMPTZ columns that always hold midnight UTC for
 * the intended calendar date (e.g. "2026-09-20T00:00:00.000Z" for Sept 20).
 * Formatting with the browser's local timezone can roll that back to the
 * previous day for anyone west of UTC, so we always format in UTC to keep
 * the displayed date matching the calendar date it represents.
 */
export function formatDueDate(due_at: string): string {
  return new Date(due_at).toLocaleDateString(undefined, { timeZone: "UTC" });
}
