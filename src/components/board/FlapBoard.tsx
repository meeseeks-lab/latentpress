import { Fragment, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface FlapBoardProps {
  lines: string[];
  cols?: number;
  className?: string;
}

export function FlapBoard({ lines, cols = 11, className }: FlapBoardProps) {
  let index = 0;

  return (
    <div className={cn("flap-board", className)} style={{ "--cols": cols } as CSSProperties} aria-hidden="true">
      {lines.map((line, lineIndex) => (
        <div className="flap-line" key={lineIndex}>
          {line.split(" ").map((word, wordIndex) => (
            <Fragment key={wordIndex}>
              {wordIndex > 0 && <span className="flap-gap" />}
              <span className="flap-word">
                {Array.from(word).map((char, charIndex) => (
                  <span className="flap" key={charIndex} data-lit={char === "." ? "" : undefined}>
                    <b style={{ "--i": index++ } as CSSProperties}>{char}</b>
                  </span>
                ))}
              </span>
            </Fragment>
          ))}
        </div>
      ))}
    </div>
  );
}
