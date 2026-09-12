"use client";

import { useEffect, useState, use } from "react";
import { formatDueDate } from "@/lib/date";
import { StatusBadge, statusBorderClass } from "@/components/StatusBadge";
import { CheckIcon, CopyIcon, XIcon } from "@/components/icons";

type Task = { id: string; title: string; due_at: string | null; status: string };

export default function OwnerDashboard({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [partnerToken, setPartnerToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function load() {
    const res = await fetch(`/api/owner/${token}`);
    if (res.ok) {
      const data = await res.json();
      setTasks(data.tasks);
      setPartnerToken(data.commitment.partner_token);
    }
    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-10">
        <p className="text-muted">Loading...</p>
      </main>
    );
  }

  const partnerLink =
    typeof window !== "undefined" && partnerToken
      ? `${window.location.origin}/t/${partnerToken}`
      : "";

  async function copyLink() {
    if (!partnerLink) return;
    try {
      await navigator.clipboard.writeText(partnerLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API unavailable — link text is still visible/selectable
    }
  }

  const doneCount = tasks.filter((t) => t.status === "done").length;

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-8">
        <h1 className="mb-1 text-2xl font-bold tracking-tight">Your tasks</h1>
        <p className="text-sm text-muted">
          {tasks.length === 0
            ? "No tasks yet."
            : `${doneCount} of ${tasks.length} done. Mark what you finish — your partner sees it instantly.`}
        </p>
      </div>

      {partnerLink && (
        <div className="mb-8 flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3">
          <div className="min-w-0">
            <p className="mb-0.5 text-xs uppercase tracking-wide text-muted">
              Share with your partner
            </p>
            <p className="truncate text-sm text-fg/80">{partnerLink}</p>
          </div>
          <button
            onClick={copyLink}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand/15 px-4 py-1.5 text-sm font-medium text-brand transition-colors hover:bg-brand/25"
          >
            <CopyIcon className="h-3.5 w-3.5" />
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {tasks.map((t) => (
          <li
            key={t.id}
            className={`flex items-center justify-between gap-4 rounded-xl border border-line ${statusBorderClass(
              t.status
            )} border-l-4 bg-surface px-5 py-4`}
          >
            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <p
                  className={`truncate font-medium ${
                    t.status === "done" ? "text-muted line-through" : "text-fg"
                  }`}
                >
                  {t.title}
                </p>
                <StatusBadge status={t.status} />
              </div>
              {t.due_at && (
                <p className="text-sm text-muted">Due {formatDueDate(t.due_at)}</p>
              )}
            </div>
            {t.status === "pending" && (
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => updateStatus(t.id, "done")}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-done/15 px-3 py-2 text-sm font-medium text-done transition-colors hover:bg-done/25"
                >
                  <CheckIcon className="h-4 w-4" />
                  Done
                </button>
                <button
                  onClick={() => updateStatus(t.id, "missed")}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-missed/15 px-3 py-2 text-sm font-medium text-missed transition-colors hover:bg-missed/25"
                >
                  <XIcon className="h-4 w-4" />
                  Missed it
                </button>
              </div>
            )}
          </li>
        ))}
        {tasks.length === 0 && (
          <li className="rounded-xl border border-dashed border-line px-5 py-8 text-center text-muted">
            No tasks were extracted — try pasting more detail.
          </li>
        )}
      </ul>
    </main>
  );
}
