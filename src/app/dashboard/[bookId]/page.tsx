"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { OverviewTab } from "@/components/book/overview-tab";
import { DocumentTab } from "@/components/book/document-tab";
import { ChaptersTab } from "@/components/book/chapters-tab";
import { CharactersTab } from "@/components/book/characters-tab";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  FileText,
  ScrollText,
  Map,
  Activity,
  BookMarked,
  Layers,
  Users,
  ChevronLeft,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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

const NAV_ITEMS = [
  { key: "overview", label: "Overview", icon: BookOpen },
  { key: "process", label: "Process", icon: FileText },
  { key: "bible", label: "Bible", icon: ScrollText },
  { key: "outline", label: "Outline", icon: Map },
  { key: "status", label: "Status", icon: Activity },
  { key: "story_so_far", label: "Story So Far", icon: BookMarked },
  { key: "chapters", label: "Chapters", icon: Layers },
  { key: "characters", label: "Characters", icon: Users },
] as const;

type TabKey = (typeof NAV_ITEMS)[number]["key"];

export default function BookWorkspacePage() {
  const { bookId } = useParams<{ bookId: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
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

  if (loading || !book)
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Sidebar */}
      <aside
        className={cn(
          "border-r border-border bg-neutral-950/50 flex flex-col shrink-0 transition-all duration-200",
          sidebarOpen ? "w-56" : "w-14"
        )}
      >
        <div className="p-3 border-b border-border flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-8 w-8"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
          {sidebarOpen && (
            <Link
              href="/dashboard"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors truncate"
            >
              ← All Books
            </Link>
          )}
        </div>

        {sidebarOpen && (
          <div className="px-4 py-3 border-b border-border">
            <h2 className="font-semibold text-sm truncate">{book.title}</h2>
            <p className="text-xs text-muted-foreground capitalize">{book.status}</p>
          </div>
        )}

        <nav className="flex-1 py-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors",
                "hover:bg-neutral-800/50",
                activeTab === key
                  ? "text-white bg-neutral-800/80 border-r-2 border-primary"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {sidebarOpen && <span className="truncate">{label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6">
        {activeTab === "overview" && <OverviewTab book={book} onUpdate={loadBook} />}
        {activeTab === "process" && <DocumentTab bookId={book.id} type="process" label="Process" />}
        {activeTab === "bible" && <DocumentTab bookId={book.id} type="bible" label="Bible" />}
        {activeTab === "outline" && <DocumentTab bookId={book.id} type="outline" label="Outline" />}
        {activeTab === "status" && <DocumentTab bookId={book.id} type="status" label="Status" />}
        {activeTab === "story_so_far" && <DocumentTab bookId={book.id} type="story_so_far" label="Story So Far" />}
        {activeTab === "chapters" && <ChaptersTab bookId={book.id} />}
        {activeTab === "characters" && <CharactersTab bookId={book.id} />}
      </main>
    </div>
  );
}
