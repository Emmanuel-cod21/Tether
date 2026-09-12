"use client";

import { useEffect, useState, use } from "react";
import { formatDueDate } from "@/lib/date";
import { StatusBadge, statusBorderClass } from "@/components/StatusBadge";
import { EyeIcon } from "@/components/icons";

type Task = { id: string; title: string; due_at: string | null; status: string };

export default function PartnerView({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function load() {
    const res = await fetch(`/api/partner/${token}`);
    if (res.ok) {
      const data = await res.json();
      setTasks(data.tasks);
      setPartnerName(data.partnerName ?? null);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-10">
        <p className="text-muted">Loading...</p>
      </main>
    );
  }

  const doneCount = tasks.filter((t) => t.status === "done").length;

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-8 flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand">
          <EyeIcon className="h-[18px] w-[18px]" />
        </span>
        <div>
          <h1 className="mb-1 text-2xl font-bold tracking-tight">
            Watching their progress
          </h1>
          <p className="text-sm text-muted">
            {partnerName ? `Hi ${partnerName} — ` : ""}
            Read-only — this updates automatically as tasks are marked done or
            missed.
            {tasks.length > 0 && ` ${doneCount} of ${tasks.length} done.`}
          </p>
        </div>
      </div>

      <ul className="flex flex-col gap-3">
        {tasks.map((t) => (
          <li
            key={t.id}
            className={`rounded-xl border border-line ${statusBorderClass(
              t.status
            )} border-l-4 bg-surface px-5 py-4`}
          >
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <p
                className={`font-medium ${
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
          </li>
        ))}
        {tasks.length === 0 && (
          <li className="rounded-xl border border-dashed border-line px-5 py-8 text-center text-muted">
            No tasks yet.
          </li>
        )}
      </ul>
    </main>
  );
}
