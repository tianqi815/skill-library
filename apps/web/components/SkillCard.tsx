import Link from "next/link";
import type { SkillEntry } from "@/lib/skills";

type SkillCardProps = {
  skill: SkillEntry;
};

export function SkillCard({ skill }: SkillCardProps) {
  return (
    <Link
      href={`/skills/${skill.name}/`}
      className="group block rounded-2xl border border-card-border bg-card/80 p-5 transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold group-hover:text-accent">
          {skill.name}
        </h3>
        <span className="rounded-full bg-pill px-2.5 py-1 text-xs text-muted">
          {skill.category}
        </span>
      </div>
      <p className="mb-4 line-clamp-3 text-sm leading-6 text-muted">
        {skill.description}
      </p>
      <div className="flex flex-wrap gap-2">
        {(skill.tags || []).slice(0, 4).map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-card-border px-2 py-0.5 text-xs text-slate-300"
          >
            {tag}
          </span>
        ))}
        {skill.hasScripts && (
          <span className="rounded-full border border-amber-500/30 px-2 py-0.5 text-xs text-amber-300">
            scripts
          </span>
        )}
      </div>
    </Link>
  );
}
