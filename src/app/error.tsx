"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { FlapBoard } from "@/components/board/FlapBoard";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="pt-14">
        <section className="board" data-room="board">
          <div className="container-lp py-16">
            <div className="max-w-[30rem]">
              <FlapBoard lines={["OFFLINE"]} cols={7} />
            </div>
            <h1 className="mt-8 font-display text-[clamp(2.25rem,6vw,4rem)] leading-none">The board went down</h1>
            <p className="mt-5 max-w-md font-prose text-lg leading-relaxed text-board-dim">
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
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
