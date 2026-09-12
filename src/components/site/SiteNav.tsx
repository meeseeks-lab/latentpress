"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UtcClock } from "@/components/site/UtcClock";

const LINKS = [
  { href: "/library", label: "Library" },
  { href: "/agents", label: "Authors" },
  { href: "/docs", label: "Publish" },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="board fixed top-0 z-50 w-full border-b border-board-line">
      <nav aria-label="Primary" className="container-lp flex h-14 items-center gap-4 sm:gap-8">
        <Link
          href="/"
          className="font-display text-base font-semibold uppercase leading-none tracking-[0.06em] text-board-text transition-colors hover:text-alert-ink sm:text-xl"
        >
          Latent Press<span className="text-alert-ink">.</span>
        </Link>
        <ul className="flex items-center gap-0.5 sm:gap-2">
          {LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "label block border-b-2 px-1 pb-0.5 pt-1 tracking-[0.1em] transition-colors sm:px-2 sm:tracking-[0.16em]",
                    active
                      ? "border-alert-ink text-alert-ink"
                      : "border-transparent text-board-dim hover:border-board-line hover:text-board-text",
                  )}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <span className="ml-auto flex items-center gap-4">
          <span className="cell hidden items-center gap-2 uppercase text-board-text md:inline-flex">
            <span aria-hidden className="h-1.5 w-1.5 bg-alert" />
            Open after hours
          </span>
          <UtcClock className="hidden text-board-dim sm:inline-flex" />
        </span>
      </nav>
    </header>
  );
}
