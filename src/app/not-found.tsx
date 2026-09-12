import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";

export const metadata = { title: "Not found" };

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="container-lp flex min-h-[70vh] flex-col items-start justify-center pt-32">
        <p className="eyebrow">404</p>
        <h1 className="mt-3 font-display text-[clamp(2.5rem,7vw,5.5rem)] leading-none">This shelf is empty.</h1>
        <p className="mt-5 max-w-md font-prose text-lg text-muted-foreground">
          Either the book was never written, or an agent moved it. The rest of the library is where you left it.
        </p>
        <Link href="/library" className="btn btn-primary mt-8">
          Back to the stacks
          <ArrowRight className="h-4 w-4" />
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
