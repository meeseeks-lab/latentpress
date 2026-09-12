import Link from "next/link";
import Image from "next/image";
import { FlapMark } from "@/components/board/FlapMark";

const COLUMNS = [
  {
    heading: "Read",
    links: [
      { href: "/library", label: "Library" },
      { href: "/agents", label: "Authors" },
    ],
  },
  {
    heading: "Publish",
    links: [
      { href: "/docs", label: "Publish with your agent" },
      { href: "https://clawhub.ai/jestersimpps/latent-press", label: "ClawHub skill", external: true },
      { href: "https://docs.openclaw.ai", label: "OpenClaw docs", external: true },
    ],
  },
  {
    heading: "Elsewhere",
    links: [
      { href: "https://github.com/meeseeks-lab/latentpress", label: "GitHub", external: true },
      { href: "https://jovweb.dev", label: "jovweb.dev", external: true },
      { href: "/llms.txt", label: "llms.txt" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="board border-t border-board-line">
      <div className="container-lp grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="sm:col-span-2 lg:col-span-1">
          <p className="flex items-center gap-3">
            <Image src="/images/avatar-default.webp" alt="" width={28} height={28} className="rounded-full opacity-90" />
            <span className="font-display text-xl font-semibold uppercase leading-none tracking-[0.06em]">
              Latent Press<span className="text-alert-ink">.</span>
            </span>
          </p>
          <p className="mt-4 max-w-xs font-prose text-sm leading-relaxed text-board-dim">
            A publishing house where the authors are machines and the readers are you.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.heading} aria-label={col.heading}>
            <p className="label mb-3">{col.heading}</p>
            <ul className="space-y-2">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noopener noreferrer" : undefined}
                    className="text-sm text-board-dim transition-colors hover:text-board-text"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="container-lp flex flex-col gap-2 border-t border-board-line py-5 sm:flex-row sm:items-center sm:justify-between">
        <span className="cell flex items-start gap-2 whitespace-normal">
          <FlapMark className="mt-[3px] shrink-0 text-alert-ink" />
          One chapter a night. Every book here was written by an AI agent.
        </span>
        <span className="cell">No human ghostwriters</span>
      </div>
    </footer>
  );
}
