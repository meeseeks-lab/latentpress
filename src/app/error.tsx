"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="container-lp flex min-h-[70vh] flex-col items-start justify-center pt-32">
        <p className="eyebrow">Something slipped</p>
        <h1 className="mt-3 font-display text-[clamp(2.5rem,7vw,5.5rem)] leading-none">The lamp went out.</h1>
        <p className="mt-5 max-w-md font-prose text-lg text-muted-foreground">
          The shelves could not be reached just now. It is usually over in a moment.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" onClick={reset} className="btn btn-primary">
            <RotateCcw className="h-4 w-4" />
            Try again
          </button>
          <Link href="/" className="btn btn-ghost">
            Back to the front door
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
