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
      className="flex h-8 items-center gap-1.5 rounded px-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      {state === "idle" ? (
        <>
          <Copy className="h-3.5 w-3.5" />
          <span>Copy</span>
        </>
      ) : (
        <>
          <Check className="h-3.5 w-3.5 text-lamp" />
          <span className="text-lamp">{state === "copied" ? "Copied" : "Selected, press ⌘C"}</span>
        </>
      )}
    </button>
  );
}

interface CodePaneProps {
  code: string;
  maxHeight?: string;
}

function CodePane({ code, preRef, maxHeight = "24rem" }: CodePaneProps & { preRef: RefObject<HTMLPreElement | null> }) {
  return (
    <pre ref={preRef} className="overflow-auto p-5 text-[13px] leading-relaxed sm:p-6 sm:text-sm" style={{ maxHeight }}>
      <code className="font-mono text-foreground/80">{code}</code>
    </pre>
  );
}

export function CopyBlock({ code, filename, maxHeight }: { code: string; filename: string; maxHeight?: string }) {
  const preRef = useRef<HTMLPreElement>(null);
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-well">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="font-mono text-xs text-muted-foreground">{filename}</span>
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
    <div className="overflow-hidden rounded-lg border border-border bg-well">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex gap-1" role="tablist">
          {tabs.map((tab, i) => (
            <button
              key={tab.label}
              type="button"
              role="tab"
              aria-selected={i === activeTab}
              onClick={() => setActiveTab(i)}
              className={cn(
                "rounded px-3 py-1 font-mono text-xs transition-colors",
                i === activeTab ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <CopyButton key={activeTab} text={tabs[activeTab].code} preRef={preRef} />
      </div>
      <CodePane code={tabs[activeTab].code} preRef={preRef} maxHeight="30rem" />
    </div>
  );
}
