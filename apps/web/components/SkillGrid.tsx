"use client";

import { useMemo, useState } from "react";
import type { SkillEntry } from "@/lib/skills";
import { SkillCard } from "./SkillCard";

type SkillGridProps = {
  skills: SkillEntry[];
  categories: string[];
};

export function SkillGrid({ skills, categories }: SkillGridProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return skills.filter((skill) => {
      const matchCategory = category === "all" || skill.category === category;
      if (!matchCategory) return false;
      if (!q) return true;
      const haystack = [
        skill.name,
        skill.description,
        skill.category,
        ...(skill.tags || []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [skills, query, category]);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search skills..."
          className="w-full rounded-xl border border-card-border bg-card px-4 py-3 text-sm outline-none ring-accent/30 focus:ring-2 lg:max-w-md"
        />
        <div className="flex flex-wrap gap-2">
          <FilterPill
            active={category === "all"}
            onClick={() => setCategory("all")}
            label="All"
          />
          {categories.map((cat) => (
            <FilterPill
              key={cat}
              active={category === cat}
              onClick={() => setCategory(cat)}
              label={cat}
            />
          ))}
        </div>
      </div>

      <p className="mb-4 text-sm text-muted">
        Showing {filtered.length} of {skills.length} skills
      </p>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((skill) => (
          <SkillCard key={skill.name} skill={skill} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-card-border p-10 text-center text-muted">
          No skills match your filters.
        </div>
      )}
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm capitalize transition ${
        active
          ? "bg-accent text-[#052e1a] font-semibold"
          : "border border-card-border bg-card text-muted hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
