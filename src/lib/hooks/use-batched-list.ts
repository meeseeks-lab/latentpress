"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const LIBRARY_PAGE_SIZE = 24;

export function useBatchedList<T>(items: T[], pageSize: number = LIBRARY_PAGE_SIZE) {
  const [count, setCount] = useState(pageSize);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCount(pageSize);
  }, [items, pageSize]);

  const hasMore = count < items.length;

  const showMore = useCallback(() => {
    setCount((c) => Math.min(c + pageSize, items.length));
  }, [items.length, pageSize]);

  const revealUpTo = useCallback(
    (index: number) => {
      if (index < 0) return;
      setCount((c) => (index < c ? c : Math.min(index + 1, items.length)));
    },
    [items.length],
  );

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) showMore();
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, showMore]);

  return { visible: items.slice(0, count), hasMore, showMore, revealUpTo, sentinelRef };
}
