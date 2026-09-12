"use client";

import { useRef, useState, type RefObject } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

type CopyState = "idle" | "copied" | "manual";

interface CopyButtonProps {
  text: string;
  preRef: RefObject<HTMLPreElement | null>;
}

function CopyButton({ text, preRef }: CopyButtonProps) {
  const [state, setState] = useState<CopyState>("idle");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      const pre = preRef.current;
      if (pre) window.getSelection()?.selectAllChildren(pre);
      setState("manual");
    }
    setTimeout(() => setState("idle"), 2500);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-live="polite"
      className={cn(
        "label inline-flex shrink-0 items-center gap-1.5 rounded-[2px] border border-board-line px-2 py-1 transition-colors",
        state === "idle" ? "text-board-dim hover:border-alert-ink hover:text-alert-ink" : "border-alert-ink text-alert-ink",
      )}
    >
      {state === "idle" ? <Copy className="h-3 w-3" /> : <Check className="h-3 w-3" />}
      <span>{state === "idle" ? "Copy" : state === "copied" ? "Copied" : "Selected"}</span>
    </button>
  );
}

function CodePane({ code, preRef, maxHeight = "24rem" }: { code: string; preRef: RefObject<HTMLPreElement | null>; maxHeight?: string }) {
  return (
    <pre ref={preRef} className="scan-body" style={{ maxHeight }}>
      <code>{code}</code>
    </pre>
  );
}

export function CopyBlock({ code, filename, maxHeight }: { code: string; filename: string; maxHeight?: string }) {
  const preRef = useRef<HTMLPreElement>(null);
  return (
    <div className="scan">
      <div className="scan-head">
        <span className="cell uppercase text-board-dim">{filename}</span>
        <CopyButton text={code} preRef={preRef} />
      </div>
      <CodePane code={code} preRef={preRef} maxHeight={maxHeight} />
    </div>
  );
}

export function TabbedCopyBlock({ tabs }: { tabs: { label: string; filename: string; code: string }[] }) {
  const [activeTab, setActiveTab] = useState(0);
  const preRef = useRef<HTMLPreElement>(null);

  return (
    <div className="scan">
      <div className="scan-head">
        <div className="flex gap-1" role="tablist">
          {tabs.map((tab, i) => (
            <button
              key={tab.label}
              type="button"
              role="tab"
              aria-selected={i === activeTab}
              onClick={() => setActiveTab(i)}
              className={cn(
                "label rounded-[2px] px-2 py-1 transition-colors",
                i === activeTab ? "bg-alert text-on-alert" : "text-board-dim hover:text-board-text",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <CopyButton key={activeTab} text={tabs[activeTab].code} preRef={preRef} />
      </div>
      <CodePane key={activeTab} code={tabs[activeTab].code} preRef={preRef} maxHeight="30rem" />
    </div>
  );
}
