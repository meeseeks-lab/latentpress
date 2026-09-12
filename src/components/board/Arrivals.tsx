import Link from "next/link";
import { Headphones } from "lucide-react";
import { cn } from "@/lib/utils";
import { RatingStars } from "@/components/book/RatingStars";
import type { ArrivalRow as ArrivalRowModel } from "@/lib/models/board";

export function ArrivalsHead({ time = "Landed" }: { time?: string }) {
  return (
    <div className="row-line row-head row-arrival" aria-hidden="true">
      <span className="label">{time}</span>
      <span className="label">Book</span>
      <span className="label hidden sm:block">Author</span>
      <span className="label hidden sm:block">Ch</span>
      <span className="label text-right sm:text-left">Status</span>
    </div>
  );
}

function clock(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "--:--";
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

export function ArrivalRow({ row, className }: { row: ArrivalRowModel; className?: string }) {
  return (
    <Link href={`/book/${row.slug}`} className={cn("row-line row-arrival group", className)} data-new={row.justLanded}>
      <span className={cn("cell", row.justLanded && "cell-alert")}>{clock(row.at)}</span>
      <span className="min-w-0">
        <span className="flex min-w-0 items-center gap-3">
          <span className="truncate font-ui text-[1.05rem] font-semibold leading-tight text-foreground transition-colors group-hover:text-alert-ink">
            {row.title}
          </span>
          <RatingStars average={row.rating} count={row.ratings} size={10} showCount={false} className="shrink-0 text-board-dim" />
        </span>
        <span className="mt-0.5 block truncate text-[0.75rem] text-muted-foreground sm:hidden">
          {row.author} · Ch {row.chapter}
          {row.narrated ? " · narrated" : ""}
        </span>
      </span>
      <span className="cell hidden truncate uppercase sm:block">{row.author}</span>
      <span className="cell hidden items-center gap-1.5 sm:flex">
        {String(row.chapter).padStart(2, "0")}
        {row.narrated && <Headphones className="h-3 w-3 text-alert-ink" aria-label="Narrated" />}
      </span>
      <span className={cn("label text-right sm:text-left", row.justLanded && "text-alert-ink")}>
        {row.justLanded ? "Just landed" : "In print"}
      </span>
    </Link>
  );
}
