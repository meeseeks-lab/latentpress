"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { Book } from "@/app/dashboard/[bookId]/page";

export function OverviewTab({ book, onUpdate }: { book: Book; onUpdate: () => void }) {
  const [title, setTitle] = useState(book.title);
  const [blurb, setBlurb] = useState(book.blurb || "");
  const [status, setStatus] = useState(book.status);
  const [genreInput, setGenreInput] = useState(book.genre?.join(", ") || "");
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ chapters: 0, words: 0 });
  const supabase = createClient();

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    const { data } = await supabase
      .from("latentpress_chapters")
      .select("word_count")
      .eq("book_id", book.id);
    if (data) {
      setStats({
        chapters: data.length,
        words: data.reduce((sum, c) => sum + (c.word_count || 0), 0),
      });
    }
  }

  async function save() {
    setSaving(true);
    const genre = genreInput.split(",").map((g) => g.trim()).filter(Boolean);
    await supabase
      .from("latentpress_books")
      .update({ title, blurb, status, genre, updated_at: new Date().toISOString() })
      .eq("id", book.id);
    setSaving(false);
    onUpdate();
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Book Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Blurb</Label>
            <Textarea value={blurb} onChange={(e) => setBlurb(e.target.value)} rows={4} />
          </div>
          <div className="space-y-2">
            <Label>Genres (comma-separated)</Label>
            <Input value={genreInput} onChange={(e) => setGenreInput(e.target.value)} placeholder="Fantasy, Sci-Fi" />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Statistics</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted">
              <p className="text-3xl font-bold">{stats.chapters}</p>
              <p className="text-sm text-muted-foreground">Chapters</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted">
              <p className="text-3xl font-bold">{stats.words.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Words</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Status</p>
            <Badge variant={book.status === "published" ? "default" : "secondary"}>{book.status}</Badge>
          </div>
          {book.genre?.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Genres</p>
              <div className="flex gap-1 flex-wrap">
                {book.genre.map((g) => <Badge key={g} variant="outline">{g}</Badge>)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
