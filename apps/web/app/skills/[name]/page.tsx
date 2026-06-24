import Link from "next/link";
import { notFound } from "next/navigation";
import { InstallCommand } from "@/components/InstallCommand";
import { SkillFileBrowser } from "@/components/SkillFileBrowser";
import { getSkillFilesBundle } from "@/lib/skill-files";
import { getAllSkills, getSkillByName } from "@/lib/skills";

type PageProps = {
  params: Promise<{ name: string }>;
};

export async function generateStaticParams() {
  return getAllSkills().map((skill) => ({ name: skill.name }));
}

export async function generateMetadata({ params }: PageProps) {
  const { name } = await params;
  const skill = getSkillByName(name);
  if (!skill) return { title: "Skill not found" };
  return {
    title: `${skill.name} | Skill Library`,
    description: skill.description,
  };
}

export default async function SkillDetailPage({ params }: PageProps) {
  const { name } = await params;
  const skill = getSkillByName(name);
  if (!skill) notFound();

  const fileBundle = getSkillFilesBundle(skill.path);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <Link href="/skills/" className="text-sm text-accent">
        Back to browse
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-pill px-3 py-1 text-xs capitalize text-muted">
                {skill.category}
              </span>
              <span className="text-xs text-muted">v{skill.version}</span>
              {skill.hasScripts && (
                <span className="rounded-full border border-amber-500/30 px-3 py-1 text-xs text-amber-300">
                  contains scripts
                </span>
              )}
            </div>
            <h1 className="text-4xl font-bold">{skill.name}</h1>
            <p className="mt-4 text-lg leading-8 text-muted">{skill.description}</p>
          </div>

          <SkillFileBrowser bundle={fileBundle} />
        </div>

        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <InstallCommand command={skill.installCommand} />

          <div className="rounded-2xl border border-card-border bg-card/70 p-5 text-sm">
            <h2 className="mb-4 font-semibold">Metadata</h2>
            <dl className="space-y-3 text-muted">
              <div>
                <dt className="text-xs uppercase tracking-wide">Author</dt>
                <dd className="text-foreground">{skill.author}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide">License</dt>
                <dd className="text-foreground">{skill.license}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide">Compatibility</dt>
                <dd className="text-foreground">{skill.compatibility}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide">Path</dt>
                <dd className="break-all font-mono text-xs text-foreground">
                  {skill.path}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide">Files</dt>
                <dd className="text-foreground">{fileBundle.fileCount}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide">Updated</dt>
                <dd className="text-foreground">
                  {new Date(skill.updatedAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>

          {(skill.tags || []).length > 0 && (
            <div className="rounded-2xl border border-card-border bg-card/70 p-5">
              <h2 className="mb-3 text-sm font-semibold">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {skill.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-card-border px-2.5 py-1 text-xs text-slate-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
