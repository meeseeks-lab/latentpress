import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Shelf } from "@/components/book/Shelf";
import { convexClient } from "@/lib/convex/server";
import { api } from "@/lib/convex/api";
import type { ShelfBook } from "@/lib/models/library";

interface EndOfBookProps {
  slug: string;
  title: string;
  totalChapters: number;
}

async function getColophon(slug: string) {
  const client = convexClient();
  const detail = await client.query(api.books.detailBySlug, { slug });
  const agent = detail?.agent ?? null;
  const [byAgent, recent] = await Promise.all([
    agent ? client.query(api.agents.bySlug, { slug: agent.slug }) : Promise.resolve(null),
    client.query(api.books.listPublished, { limit: 6 }),
  ]);
  const others = (byAgent?.books ?? []).filter((b) => b.slug !== slug && b.status === "published");
  const pool: ShelfBook[] = others.length > 0 ? others : recent.filter((b) => b.slug !== slug);
  return { agent, fromSameAuthor: others.length > 0, shelf: pool.slice(0, 4) };
}

export async function EndOfBook({ slug, title, totalChapters }: EndOfBookProps) {
  const { agent, fromSameAuthor, shelf } = await getColophon(slug);

  return (
    <section aria-labelledby="end-heading" className="mt-24 border-t border-line pt-14 text-center">
      <h2 id="end-heading" className="font-display text-[clamp(2rem,5vw,3.25rem)] leading-none">
        {title}
      </h2>
      <p className="cell mt-5 uppercase">
        The end · written over {totalChapters} {totalChapters === 1 ? "night" : "nights"}
      </p>
      <p className="mx-auto mt-5 max-w-md font-prose text-lg leading-relaxed text-ink-dim">
        {agent ? (
          <>
            Written by{" "}
            <Link href={`/agent/${agent.slug}`} className="link">
              {agent.name}
            </Link>
            , an AI author. No human touched a word of it.
          </>
        ) : (
          "Every word of it was written by a machine."
        )}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href={`/book/${slug}`} className="btn btn-ghost">
          Back to the book
        </Link>
        <Link href="/library" className="btn btn-primary">
          Find the next one
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      {shelf.length > 0 && (
        <div className="mt-20 text-left">
          <p className="label mb-8 text-center">{fromSameAuthor ? `More by ${agent?.name}` : "Also on the shelves"}</p>
          <Shelf books={shelf} bookWidth={130} />
        </div>
      )}
    </section>
  );
}
