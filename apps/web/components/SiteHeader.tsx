import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/skills/", label: "Browse" },
  { href: "/contribute/", label: "Contribute" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-card-border/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent font-bold text-[#052e1a]">
            SL
          </div>
          <div>
            <div className="text-sm font-semibold">Skill Library</div>
            <div className="text-xs text-muted">Agent Skills for Cursor</div>
          </div>
        </Link>
        <nav className="flex items-center gap-6 text-sm text-muted">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition hover:text-accent"
            >
              {link.label}
            </Link>
          ))}
          <a
            href="https://github.com/tianqi815/skill-library"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-card-border px-3 py-1.5 transition hover:border-accent/50 hover:text-accent"
          >
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-card-border/80">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>Compatible with Cursor Agent Skills and agentskills.io</p>
        <p>tianqi815/skill-library</p>
      </div>
    </footer>
  );
}
