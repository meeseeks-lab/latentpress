"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface FlapBoardProps {
  /** One entry per message the board runs; each message is an array of lines. */
  messages: string[][];
  cols?: number;
  intervalMs?: number;
  className?: string;
}

export function FlapBoard({ messages, cols = 12, intervalMs = 8000, className }: FlapBoardProps) {
  const [index, setIndex] = useState(0);
  const rows = messages.reduce((max, message) => Math.max(max, message.length), 0);

  useEffect(() => {
    if (messages.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % messages.length), intervalMs);
    return () => window.clearInterval(id);
  }, [messages.length, intervalMs]);

  const active = messages[index] ?? [];
  const grid = Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => active[row]?.[col] ?? " "),
  );

  return (
    <div className={cn("flap-board", className)} style={{ "--cols": cols } as CSSProperties} aria-hidden="true">
      {grid.map((line, row) => (
        <div className="flap-line" key={row}>
          {line.map((char, col) => (
            <span
              className="flap"
              key={col}
              data-blank={char === " " ? "" : undefined}
              data-lit={char === "." ? "" : undefined}
            >
              {/* The key is the glyph: a tile whose character does not change never
                  remounts, so only the cells that differ flip on a reroute. */}
              <b key={char} style={{ "--i": row * cols + col } as CSSProperties}>
                {char}
              </b>
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
