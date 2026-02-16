"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import dynamic from "next/dynamic";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

export function DocumentTab({ bookId, type, label }: { bookId: string; type: string; label: string }) {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadDocument();
  }, [bookId, type]);

  async function loadDocument() {
    const { data } = await supabase
      .from("latentpress_documents")
      .select("content")
      .eq("book_id", bookId)
      .eq("type", type)
      .single();
    if (data) setContent(data.content || "");
  }

  const saveContent = useCallback(async (text: string) => {
    setSaving(true);
    await supabase
      .from("latentpress_documents")
      .update({ content: text, updated_at: new Date().toISOString() })
      .eq("book_id", bookId)
      .eq("type", type);
    setSaving(false);
    setLastSaved(new Date());
  }, [bookId, type]);

  function handleChange(value?: string) {
    const text = value || "";
    setContent(text);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => saveContent(text), 1000);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{label}</CardTitle>
        <div className="flex items-center gap-2">
          {saving && <Badge variant="secondary">Saving...</Badge>}
          {lastSaved && !saving && (
            <span className="text-xs text-muted-foreground">
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div data-color-mode="dark">
          <MDEditor value={content} onChange={handleChange} height={500} preview="edit" />
        </div>
      </CardContent>
    </Card>
  );
}
