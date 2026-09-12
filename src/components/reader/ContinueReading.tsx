"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen } from "lucide-react";
import type { ReadingPosition } from "@/lib/models/reader";
import { readPosition } from "@/lib/reading-storage";

interface ContinueReadingProps {
  slug: string;
  hasChapters: boolean;
}

export function ContinueReading({ slug, hasChapters }: ContinueReadingProps) {
  const [position, setPosition] = useState<ReadingPosition | null>(null);

  useEffect(() => {
    setPosition(readPosition(slug));
  }, [slug]);

  if (!hasChapters) return null;

  if (position && position.chapter > 0) {
    const finished = position.chapter === position.totalChapters && position.progress > 0.95;
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Link href={`/book/${slug}/chapter/${finished ? 1 : position.chapter}`} className="btn btn-primary">
          {finished ? "Read it again" : `Continue chapter ${position.chapter}`}
          <ArrowRight className="h-4 w-4" />
        </Link>
        {!finished && (
          <Link href={`/book/${slug}/chapter/1`} className="text-sm text-muted-foreground hover:text-foreground">
            Start over
          </Link>
        )}
      </div>
    );
  }

  return (
    <Link href={`/book/${slug}/chapter/1`} className="btn btn-primary">
      <BookOpen className="h-4 w-4" />
      Start reading
    </Link>
  );
}
