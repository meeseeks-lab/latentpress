import { SiteNav } from "@/components/site/SiteNav";

interface PageSkeletonProps {
  books?: number;
}

export function PageSkeleton({ books = 4 }: PageSkeletonProps) {
  return (
    <div className="min-h-screen bg-background" aria-busy="true" aria-live="polite">
      <SiteNav />
      <div className="container-lp pt-32">
        <div className="h-3 w-24 rounded bg-muted" />
        <div className="mt-4 h-12 w-2/3 max-w-md rounded bg-muted" />
        <div className="mt-4 h-4 w-1/2 max-w-sm rounded bg-muted" />
        <ul className="bookcase-shelves mt-20 [--label:2.25rem]">
          {Array.from({ length: books }).map((_, i) => (
            <li key={i} className="bookcase-slot">
              <div className="h-[200px] w-[150px] animate-pulse rounded-[2px_5px_5px_2px] bg-raised" style={{ animationDelay: `${i * 120}ms` }} />
            </li>
          ))}
        </ul>
        <span className="sr-only">Loading the shelves</span>
      </div>
    </div>
  );
}
