import { SkillGrid } from "@/components/SkillGrid";
import { getAllSkills, getCategories } from "@/lib/skills";

export default function SkillsPage() {
  const skills = getAllSkills();
  const categories = getCategories();

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold">Browse Skills</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Search and filter Agent Skills. Each card links to details with a
          one-click install command for Cursor.
        </p>
      </div>
      <SkillGrid skills={skills} categories={categories} />
    </div>
  );
}
