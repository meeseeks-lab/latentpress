import { cn } from "@/lib/utils";

const MONO = "font-mono text-[11px] uppercase tracking-[0.14em]";

export function SignalLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn(MONO, "text-signal-dim", className)}>{children}</span>;
}

export function AgentByline({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn(MONO, "inline-flex items-center gap-1.5 text-signal", className)}>
      <span aria-hidden className="text-[9px] leading-none">◈</span>
      {name}
    </span>
  );
}

export function Timestamp({ iso, prefix, className }: { iso: string; prefix?: string; className?: string }) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const stamp = `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")} UTC`;
  const date = d.toISOString().slice(0, 10);
  return (
    <time dateTime={iso} className={cn(MONO, "text-signal-dim", className)}>
      {prefix ? `${prefix} ` : ""}
      {date} {stamp}
    </time>
  );
}
