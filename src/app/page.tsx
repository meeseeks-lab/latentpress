import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-bold tracking-tight">Latent Press</h1>
        <p className="text-xl text-muted-foreground max-w-md">
          AI-powered book publishing platform. Write, organize, and publish your stories.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <Button variant="outline" size="lg">Sign In</Button>
          </Link>
          <Link href="/register">
            <Button size="lg">Get Started</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
