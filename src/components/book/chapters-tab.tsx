"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, ArrowLeft, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

interface Chapter {
  id: string;
  number: number;
  title: string;
  content: string;
  word_count: number;
}

export function ChaptersTab({ bookId }: { bookId: string }) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [editing, setEditing] = useState<Chapter | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const supabase = createClient();

  useEffect(() => { loadChapters(); }, [bookId]);

  async function loadChapters() {
    const { data } = await supabase
      .from("latentpress_chapters")
      .select("*")
      .eq("book_id", bookId)
      .order("number");
    if (data) setChapters(data);
  }

  async function addChapter() {
    if (!newTitle.trim()) return;
    const number = chapters.length + 1;
    await supabase.from("latentpress_chapters").insert({
      book_id: bookId, number, title: newTitle, content: "", word_count: 0,
    });
    setNewTitle("");
    setOpen(false);
    loadChapters();
  }

  async function deleteChapter(id: string) {
    if (!confirm("Delete this chapter?")) return;
    await supabase.from("latentpress_chapters").delete().eq("id", id);
    if (editing?.id === id) setEditing(null);
    loadChapters();
  }

  const saveChapter = useCallback(async (chapter: Chapter, text: string) => {
    setSaving(true);
    const word_count = text.trim() ? text.trim().split(/\s+/).length : 0;
    await supabase
      .from("latentpress_chapters")
      .update({ content: text, word_count, updated_at: new Date().toISOString() })
      .eq("id", chapter.id);
    setSaving(false);
    setLastSaved(new Date());
    loadChapters();
  }, [bookId]);

  function handleEditorChange(value?: string) {
    if (!editing) return;
    const text = value || "";
    setEditing({ ...editing, content: text });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => saveChapter(editing, text), 1000);
  }

  if (editing) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setEditing(null); loadChapters(); }}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <CardTitle>Ch. {editing.number}: {editing.title}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {saving && <Badge variant="secondary">Saving...</Badge>}
            {lastSaved && !saving && (
              <span className="text-xs text-muted-foreground">Saved {lastSaved.toLocaleTimeString()}</span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div data-color-mode="dark">
            <MDEditor value={editing.content} onChange={handleEditorChange} height={600} preview="edit" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Chapters</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Chapter</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Chapter</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Chapter Title</Label>
                <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Chapter title" onKeyDown={(e) => e.key === "Enter" && addChapter()} />
              </div>
              <Button onClick={addChapter} className="w-full">Add Chapter</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {chapters.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No chapters yet.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {chapters.map((ch) => (
            <Card key={ch.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => setEditing(ch)}>
              <CardContent className="flex items-center justify-between py-3">
                <div>
                  <span className="font-medium">Ch. {ch.number}: {ch.title}</span>
                  <span className="text-sm text-muted-foreground ml-4">{ch.word_count.toLocaleString()} words</span>
                </div>
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); deleteChapter(ch.id); }}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
