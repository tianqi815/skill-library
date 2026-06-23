import { InstallCommand } from "@/components/InstallCommand";

export default function ContributePage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-bold">Contribute a Skill</h1>
      <p className="mt-4 text-lg leading-8 text-muted">
        Skills are reviewed via pull request. Follow the Agent Skills open
        standard so Cursor and other agents can discover your skill automatically.
      </p>

      <div className="mt-10 space-y-8">
        <section className="rounded-2xl border border-card-border bg-card/60 p-6">
          <h2 className="text-xl font-semibold">1. Create a skill directory</h2>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-[#0f172a] p-4 text-sm">
{`skills/<category>/<skill-name>/SKILL.md
skills/<category>/<skill-name>/references/   # optional
skills/<category>/<skill-name>/scripts/      # optional`}
          </pre>
        </section>

        <section className="rounded-2xl border border-card-border bg-card/60 p-6">
          <h2 className="text-xl font-semibold">2. Validate locally</h2>
          <InstallCommand command="npm run validate" className="mt-4" />
        </section>

        <section className="rounded-2xl border border-card-border bg-card/60 p-6">
          <h2 className="text-xl font-semibold">3. Open a pull request</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-muted">
            <li>`name` must match the folder name (kebab-case)</li>
            <li>`description` must explain what and when (third person)</li>
            <li>No secrets, credentials, or internal-only URLs</li>
            <li>Scripts require explicit security review</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-card-border bg-card/60 p-6">
          <h2 className="text-xl font-semibold">Template</h2>
          <p className="mt-3 text-muted">
            Start from <code>skills/_templates/SKILL.template.md</code> in the
            repository.
          </p>
        </section>
      </div>
    </div>
  );
}
