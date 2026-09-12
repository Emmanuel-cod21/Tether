import { CheckIcon, ClockIcon, XIcon } from "./icons";

const STATUS_META = {
  pending: {
    label: "Pending",
    badge: "bg-pending/15 text-pending",
    border: "border-l-pending",
    Icon: ClockIcon,
  },
  done: {
    label: "Done",
    badge: "bg-done/15 text-done",
    border: "border-l-done",
    Icon: CheckIcon,
  },
  missed: {
    label: "Missed",
    badge: "bg-missed/15 text-missed",
    border: "border-l-missed",
    Icon: XIcon,
  },
} as const;

type Status = keyof typeof STATUS_META;

function meta(status: string) {
  return STATUS_META[status as Status] ?? STATUS_META.pending;
}

/** Small pill showing a task's status, used identically on the dashboard and partner view. */
export function StatusBadge({ status }: { status: string }) {
  const { label, badge, Icon } = meta(status);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${badge}`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

/** Left-border color class for a task card, keyed off the same status. */
export function statusBorderClass(status: string) {
  return meta(status).border;
}
