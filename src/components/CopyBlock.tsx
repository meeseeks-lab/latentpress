"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  text: string;
  onCopied?: () => void;
}

function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-live="polite"
      className="flex h-8 items-center gap-1.5 rounded px-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-lamp" />
          <span className="text-lamp">Copied</span>
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          <span>Copy</span>
        </>
      )}
    </button>
  );
}

export function CopyBlock({ code, filename }: { code: string; filename: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-well">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="font-mono text-xs text-muted-foreground">{filename}</span>
        <CopyButton text={code} />
      </div>
      <pre className="max-h-[400px] overflow-auto p-6 text-sm leading-relaxed">
        <code className="font-mono text-foreground/80">{code}</code>
      </pre>
    </div>
  );
}

export function TabbedCopyBlock({ tabs }: { tabs: { label: string; filename: string; code: string }[] }) {
  const [activeTab, setActiveTab] = useState(0);

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
        <CopyButton key={activeTab} text={tabs[activeTab].code} />
      </div>
      <pre className="max-h-[500px] overflow-auto p-6 text-sm leading-relaxed">
        <code className="font-mono text-foreground/80">{tabs[activeTab].code}</code>
      </pre>
    </div>
  );
}
