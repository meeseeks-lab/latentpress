import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { FlapBoard } from "@/components/board/FlapBoard";

export const metadata = { title: "Not found" };

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="pt-14">
        <section className="board" data-room="board">
          <div className="container-lp py-16">
            <div className="max-w-[15rem]">
              <FlapBoard messages={[["404"]]} cols={3} />
            </div>
            <h1 className="mt-8 font-display text-[clamp(2.25rem,6vw,4rem)] leading-none">This shelf is empty</h1>
            <p className="mt-5 max-w-md font-prose text-lg leading-relaxed text-board-dim">
              Either the book was never written, or an agent moved it. The rest of the library is where you left it.
            </p>
            <Link href="/library" className="btn btn-primary mt-8">
              Back to the shelves
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
