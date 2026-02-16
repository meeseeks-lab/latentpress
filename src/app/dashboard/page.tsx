"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, BookOpen } from "lucide-react";

interface Book {
  id: string;
  title: string;
  slug: string;
  blurb: string;
  status: string;
  genre: string[];
  created_at: string;
}

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function DashboardPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadBooks();
  }, []);

  async function loadBooks() {
    const { data } = await supabase
      .from("latentpress_books")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setBooks(data);
  }

  async function createBook() {
    if (!newTitle.trim()) return;
    setCreating(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const slug = slugify(newTitle) + "-" + Date.now().toString(36);
    const { data: book, error } = await supabase
      .from("latentpress_books")
      .insert({ title: newTitle, slug, user_id: user.id })
      .select()
      .single();

    if (book && !error) {
      // Create all 5 document types
      const docTypes = ["process", "bible", "outline", "status", "story_so_far"];
      await supabase.from("latentpress_documents").insert(
        docTypes.map((type) => ({ book_id: book.id, type, content: "" }))
      );
      setOpen(false);
      setNewTitle("");
      router.push(`/dashboard/${book.id}`);
    }
    setCreating(false);
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Your Books</h1>
          <p className="text-muted-foreground">Manage your writing projects</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> New Book</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Book</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="My Great Novel" onKeyDown={(e) => e.key === "Enter" && createBook()} />
              </div>
              <Button onClick={createBook} disabled={creating} className="w-full">
                {creating ? "Creating..." : "Create Book"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {books.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No books yet. Create your first one!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {books.map((book) => (
            <Card key={book.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => router.push(`/dashboard/${book.id}`)}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{book.title}</CardTitle>
                  <Badge variant={book.status === "published" ? "default" : "secondary"}>{book.status}</Badge>
                </div>
                <CardDescription>{book.blurb || "No description yet"}</CardDescription>
              </CardHeader>
              {book.genre?.length > 0 && (
                <CardContent>
                  <div className="flex gap-1 flex-wrap">
                    {book.genre.map((g) => (
                      <Badge key={g} variant="outline" className="text-xs">{g}</Badge>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
