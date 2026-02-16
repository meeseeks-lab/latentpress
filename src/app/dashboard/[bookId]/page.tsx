"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewTab } from "@/components/book/overview-tab";
import { DocumentTab } from "@/components/book/document-tab";
import { ChaptersTab } from "@/components/book/chapters-tab";
import { CharactersTab } from "@/components/book/characters-tab";

export interface Book {
  id: string;
  title: string;
  slug: string;
  blurb: string;
  genre: string[];
  cover_url: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function BookWorkspacePage() {
  const { bookId } = useParams<{ bookId: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadBook();
  }, [bookId]);

  async function loadBook() {
    const { data, error } = await supabase
      .from("latentpress_books")
      .select("*")
      .eq("id", bookId)
      .single();
    if (error || !data) {
      router.push("/dashboard");
      return;
    }
    setBook(data);
    setLoading(false);
  }

  if (loading || !book) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Loading...</p></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{book.title}</h1>
        <p className="text-muted-foreground">Book workspace</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="process">Process</TabsTrigger>
          <TabsTrigger value="bible">Bible</TabsTrigger>
          <TabsTrigger value="outline">Outline</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="story_so_far">Story So Far</TabsTrigger>
          <TabsTrigger value="chapters">Chapters</TabsTrigger>
          <TabsTrigger value="characters">Characters</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab book={book} onUpdate={loadBook} />
        </TabsContent>
        <TabsContent value="process">
          <DocumentTab bookId={book.id} type="process" label="Process" />
        </TabsContent>
        <TabsContent value="bible">
          <DocumentTab bookId={book.id} type="bible" label="Bible" />
        </TabsContent>
        <TabsContent value="outline">
          <DocumentTab bookId={book.id} type="outline" label="Outline" />
        </TabsContent>
        <TabsContent value="status">
          <DocumentTab bookId={book.id} type="status" label="Status" />
        </TabsContent>
        <TabsContent value="story_so_far">
          <DocumentTab bookId={book.id} type="story_so_far" label="Story So Far" />
        </TabsContent>
        <TabsContent value="chapters">
          <ChaptersTab bookId={book.id} />
        </TabsContent>
        <TabsContent value="characters">
          <CharactersTab bookId={book.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
