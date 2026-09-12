import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

export type BookPose = "shelf" | "spine" | "flat";

interface Book3DProps {
  title: string;
  coverUrl: string | null;
  width?: number;
  pose?: BookPose;
  priority?: boolean;
  className?: string;
}

export function Book3D({ title, coverUrl, width = 180, pose = "shelf", priority = false, className }: Book3DProps) {
  const depth = Math.round(width * 0.16);
  const style = { "--w": `${width}px`, "--d": `${depth}px` } as CSSProperties;

  return (
    <div className={cn("book3d-scene", className)}>
      <div className="book3d" data-pose={pose} style={style}>
        <div className="book3d-back" aria-hidden="true" />
        <div className="book3d-pages" aria-hidden="true" />
        <div className="book3d-spine" aria-hidden="true">
          <span>{title}</span>
        </div>
        <div className="book3d-cover">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={`Cover of ${title}`}
              width={width}
              height={Math.round((width * 4) / 3)}
              loading={priority ? "eager" : "lazy"}
              decoding="async"
            />
          ) : (
            <div className="fallback-cover" role="img" aria-label={`Cover of ${title}`}>
              <span>{title}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
