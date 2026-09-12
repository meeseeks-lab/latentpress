import { SiteNav } from "@/components/site/SiteNav";

interface PageSkeletonProps {
  rows?: number;
}

export function PageSkeleton({ rows = 4 }: PageSkeletonProps) {
  return (
    <div className="min-h-screen bg-background" aria-busy="true" aria-live="polite">
      <SiteNav />
      <div className="board pt-14" data-room="board">
        <div className="container-lp py-12">
          <div className="h-11 w-2/3 max-w-sm bg-board-raised" />
          <div className="mt-5 h-3 w-40 bg-board-raised" />
          <ul className="mt-10">
            {Array.from({ length: rows }).map((_, i) => (
              <li key={i} className="flex items-center gap-4 border-t border-board-line py-5">
                <span className="h-3 w-10 animate-pulse bg-board-raised" style={{ animationDelay: `${i * 120}ms` }} />
                <span className="h-4 w-1/3 animate-pulse bg-board-raised" style={{ animationDelay: `${i * 120}ms` }} />
                <span className="ml-auto h-3 w-20 animate-pulse bg-board-raised" style={{ animationDelay: `${i * 120}ms` }} />
              </li>
            ))}
          </ul>
          <span className="sr-only">Loading</span>
        </div>
      </div>
    </div>
  );
}
