"use client";

import { useRef, type CSSProperties, type PointerEvent } from "react";
import { Book3D } from "@/components/book/Book3D";

interface CoverTiltProps {
  title: string;
  coverUrl: string | null;
  width?: number;
}

export function CoverTilt({ title, coverUrl, width = 280 }: CoverTiltProps) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.setProperty("--ry", `${-18 + x * 28}deg`);
    el.style.setProperty("--rx", `${-y * 10}deg`);
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.removeProperty("--ry");
    el.style.removeProperty("--rx");
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="[&_.book3d]:transition-transform [&_.book3d]:duration-300"
      style={{ "--ry": "-18deg" } as CSSProperties}
    >
      <Book3D title={title} coverUrl={coverUrl} width={width} pose="shelf" priority />
    </div>
  );
}
