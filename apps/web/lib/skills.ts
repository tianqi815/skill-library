import catalog from "../../../catalog/skills.json";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export type SkillEntry = {
  name: string;
  description: string;
  category: string;
  tags: string[];
  author: string;
  version: string;
  license: string;
  compatibility: string;
  path: string;
  installCommand: string;
  updatedAt: string;
  hasScripts: boolean;
};

export type SkillCatalog = {
  generatedAt: string;
  repository: string;
  count: number;
  skills: SkillEntry[];
};

export function getCatalog(): SkillCatalog {
  return catalog as SkillCatalog;
}

export function getAllSkills(): SkillEntry[] {
  return getCatalog().skills;
}

export function getSkillByName(name: string): SkillEntry | undefined {
  return getAllSkills().find((skill) => skill.name === name);
}

export function getCategories(): string[] {
  const set = new Set(getAllSkills().map((skill) => skill.category));
  return Array.from(set).sort();
}

export function getSkillMarkdown(skill: SkillEntry): string {
  const root = join(process.cwd(), "..", "..");
  const filePath = join(root, skill.path, "SKILL.md");
  const raw = readFileSync(filePath, "utf8");
  return raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
}

export function getSkillMarkdownBodyFromPath(relativeSkillPath: string): string {
  const root = join(process.cwd(), "..", "..");
  const filePath = join(root, relativeSkillPath, "SKILL.md");
  const raw = readFileSync(filePath, "utf8");
  return raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
}
