"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "text" | "canvas" | "slack";

const TABS: { mode: Mode; label: string }[] = [
  { mode: "text", label: "Paste text" },
  { mode: "canvas", label: "Connect Canvas" },
  { mode: "slack", label: "Connect Slack" },
];

const fieldClass =
  "w-full rounded-lg border border-line bg-surface-2 px-4 py-3 text-fg placeholder:text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40 transition-colors";

const hintClass = "text-xs text-muted -mt-2";

export default function Home() {
  const [mode, setMode] = useState<Mode>("text");
  const [rawText, setRawText] = useState("");
  const [canvasDomain, setCanvasDomain] = useState("");
  const [canvasToken, setCanvasToken] = useState("");
  const [slackSourceToken, setSlackSourceToken] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const body =
        mode === "canvas"
          ? { canvasDomain, canvasToken, partnerName, partnerEmail }
          : mode === "slack"
          ? { slackSourceToken, partnerName, partnerEmail }
          : { rawText, partnerName, partnerEmail };

      const res = await fetch("/api/commitments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Something went wrong. Try again.");
      }
      router.push(`/c/${data.ownerToken}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const loadingLabel =
    mode === "canvas"
      ? "Fetching from Canvas..."
      : mode === "slack"
      ? "Fetching from Slack..."
      : "Setting up...";

  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-brand/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 right-0 h-56 w-56 rounded-full bg-done/10 blur-3xl"
      />

      <main className="relative mx-auto max-w-xl px-6 py-14">
        <div className="mb-10 text-center">
          <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-widest text-brand">
            Accountability, automated
          </span>
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-fg">Tether</h1>
          <p className="mx-auto max-w-md text-sm text-muted">
            Turn a syllabus, a Canvas course, or your Slack reminders into commitments
            — then let someone you trust watch you keep them.
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-surface/60 p-6 shadow-xl shadow-black/20">
          <div className="mb-6 flex w-full rounded-xl border border-line bg-surface p-1">
            {TABS.map((tab) => (
              <button
                key={tab.mode}
                type="button"
                onClick={() => setMode(tab.mode)}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  mode === tab.mode
                    ? "bg-brand text-brand-fg shadow-sm"
                    : "text-muted hover:text-fg"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === "text" && (
              <textarea
                className={`${fieldClass} h-40 resize-none`}
                placeholder="Paste your syllabus, task list, or calendar here..."
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                required
              />
            )}

            {mode === "canvas" && (
              <>
                <input
                  className={fieldClass}
                  placeholder="Canvas domain (e.g. uh.instructure.com)"
                  value={canvasDomain}
                  onChange={(e) => setCanvasDomain(e.target.value)}
                  required
                />
                <input
                  className={fieldClass}
                  type="password"
                  placeholder="Canvas access token"
                  value={canvasToken}
                  onChange={(e) => setCanvasToken(e.target.value)}
                  required
                />
                <p className={hintClass}>
                  Generate one in Canvas under Account → Settings → New Access
                  Token. It&apos;s only used to fetch your assignments for this
                  request and is never stored.
                  {process.env.NODE_ENV !== "production" && (
                    <>
                      {" "}
                      Demoing without a real token? Use{" "}
                      <code className="rounded bg-surface-2 px-1 text-fg">demo</code>{" "}
                      as the token.
                    </>
                  )}
                </p>
              </>
            )}

            {mode === "slack" && (
              <>
                <input
                  className={fieldClass}
                  type="password"
                  placeholder="Slack User OAuth Token"
                  value={slackSourceToken}
                  onChange={(e) => setSlackSourceToken(e.target.value)}
                  required
                />
                <p className={hintClass}>
                  Generate one at api.slack.com/apps with the reminders:read
                  scope. It&apos;s only used to fetch your reminders for this
                  request and is never stored.
                  {process.env.NODE_ENV !== "production" && (
                    <>
                      {" "}
                      Demoing without a real token? Use{" "}
                      <code className="rounded bg-surface-2 px-1 text-fg">demo</code>{" "}
                      as the token.
                    </>
                  )}
                </p>
              </>
            )}

            <input
              className={fieldClass}
              placeholder="Accountability partner's name"
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
            />
            <input
              className={fieldClass}
              type="email"
              placeholder="Their email"
              value={partnerEmail}
              onChange={(e) => setPartnerEmail(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-brand py-3 font-semibold text-brand-fg shadow-[0_8px_24px_-8px_var(--color-brand)] transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? loadingLabel : "Start being accountable"}
            </button>
            {error && (
              <p className="rounded-lg border border-missed/40 bg-missed/10 px-4 py-3 text-sm text-missed">
                {error}
              </p>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}
