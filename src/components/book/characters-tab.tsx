"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

interface Character {
  id: string;
  name: string;
  voice: string | null;
  description: string | null;
}

export function CharactersTab({ bookId }: { bookId: string }) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [voice, setVoice] = useState("");
  const [description, setDescription] = useState("");
  const supabase = createClient();

  useEffect(() => { loadCharacters(); }, [bookId]);

  async function loadCharacters() {
    const { data } = await supabase
      .from("latentpress_characters")
      .select("*")
      .eq("book_id", bookId)
      .order("created_at");
    if (data) setCharacters(data);
  }

  async function addCharacter() {
    if (!name.trim()) return;
    await supabase.from("latentpress_characters").insert({
      book_id: bookId, name, voice: voice || null, description: description || null,
    });
    setName(""); setVoice(""); setDescription("");
    setOpen(false);
    loadCharacters();
  }

  async function deleteCharacter(id: string) {
    if (!confirm("Delete this character?")) return;
    await supabase.from("latentpress_characters").delete().eq("id", id);
    loadCharacters();
  }

  async function updateCharacter(id: string, field: string, value: string) {
    await supabase.from("latentpress_characters").update({ [field]: value }).eq("id", id);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Characters</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Character</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Character</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Voice</Label>
                <Input value={voice} onChange={(e) => setVoice(e.target.value)} placeholder="e.g. deep, gravelly" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              </div>
              <Button onClick={addCharacter} className="w-full">Add Character</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {characters.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No characters yet.</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {characters.map((ch) => (
            <Card key={ch.id}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Input defaultValue={ch.name} className="font-semibold text-lg border-0 p-0 h-auto" onBlur={(e) => updateCharacter(ch.id, "name", e.target.value)} />
                  <Button variant="ghost" size="sm" onClick={() => deleteCharacter(ch.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Voice</Label>
                  <Input defaultValue={ch.voice || ""} placeholder="Assign voice..." className="h-8" onBlur={(e) => updateCharacter(ch.id, "voice", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <Textarea defaultValue={ch.description || ""} rows={2} className="text-sm" onBlur={(e) => updateCharacter(ch.id, "description", e.target.value)} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
