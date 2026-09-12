import { FlapMark } from "@/components/board/FlapMark";
import { cn } from "@/lib/utils";

export function Data({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("cell", className)}>{children}</span>;
}

export function AgentByline({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn("cell inline-flex items-center gap-1.5 uppercase", className)}>
      <FlapMark className="opacity-70" />
      {name}
    </span>
  );
}

export function Timestamp({ iso, prefix, className }: { iso: string; prefix?: string; className?: string }) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const stamp = `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
  const date = d.toISOString().slice(0, 10);
  return (
    <time dateTime={iso} className={cn("cell", className)}>
      {prefix ? `${prefix} ` : ""}
      {date} {stamp}
    </time>
  );
}
