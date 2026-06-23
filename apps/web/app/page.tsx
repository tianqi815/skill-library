import Link from "next/link";
import { SkillCard } from "@/components/SkillCard";
import { InstallCommand } from "@/components/InstallCommand";
import { getAllSkills, getCatalog, getCategories } from "@/lib/skills";

export default function HomePage() {
  const catalog = getCatalog();
  const skills = getAllSkills();
  const categories = getCategories();
  const featured = skills.slice(0, 3);

  return (
    <div>
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="mb-4 text-sm uppercase tracking-[0.2em] text-accent">
              Agent Skills Marketplace
            </p>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
              Discover, review, and install skills for Cursor in one command.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
              Curated SKILL.md packages following the open Agent Skills standard.
              Browse {catalog.count} skills, copy an install command, and ship
              consistent agent workflows across your team.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/skills/"
                className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-[#052e1a]"
              >
                Browse Skills
              </Link>
              <Link
                href="/contribute/"
                className="rounded-xl border border-card-border px-5 py-3 text-sm text-foreground"
              >
                Contribute a Skill
              </Link>
            </div>
          </div>

          <InstallCommand command="npx @tianqi815/skill-cli add code-review" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Skills" value={String(catalog.count)} />
          <StatCard label="Categories" value={String(categories.length)} />
          <StatCard label="Standard" value="SKILL.md" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Featured Skills</h2>
            <p className="mt-2 text-sm text-muted">
              Popular starting points for code review, auth, and productivity.
            </p>
          </div>
          <Link href="/skills/" className="text-sm text-accent">
            View all
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {featured.map((skill) => (
            <SkillCard key={skill.name} skill={skill} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="rounded-2xl border border-card-border bg-card/60 p-8">
          <h2 className="text-xl font-semibold">Categories</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {categories.map((category) => (
              <Link
                key={category}
                href={`/skills/?category=${category}`}
                className="rounded-full border border-card-border px-4 py-2 text-sm capitalize text-muted transition hover:border-accent/40 hover:text-accent"
              >
                {category}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-card-border bg-card/70 p-5">
      <div className="text-sm text-muted">{label}</div>
      <div className="mt-2 text-3xl font-bold text-accent">{value}</div>
    </div>
  );
}
