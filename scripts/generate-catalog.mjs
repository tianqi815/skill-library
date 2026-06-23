#!/usr/bin/env node

import {
  readdirSync,
  readFileSync,
  writeFileSync,
  statSync,
  existsSync,
  mkdirSync,
} from "node:fs";
import { join, dirname, basename, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SKILLS_ROOT = join(ROOT, "skills");
const CATALOG_PATH = join(ROOT, "catalog", "skills.json");
const REPO = "tianqi815/skill-library";
const CLI_INSTALL = `npx skills add ${REPO} --skill`;

function walkSkillFiles(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "_templates") continue;
      walkSkillFiles(fullPath, files);
    } else if (entry.name === "SKILL.md") {
      files.push(fullPath);
    }
  }
  return files;
}

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  return parseYaml(match[1]);
}

function getCategory(skillPath) {
  const rel = relative(SKILLS_ROOT, skillPath);
  const parts = rel.split(/[/\\]/);
  return parts.length > 2 ? parts[0] : "general";
}

function hasScripts(skillDir) {
  const scriptsDir = join(skillDir, "scripts");
  return existsSync(scriptsDir) && statSync(scriptsDir).isDirectory();
}

function main() {
  const skillFiles = walkSkillFiles(SKILLS_ROOT);
  const skills = skillFiles.map((filePath) => {
    const content = readFileSync(filePath, "utf8");
    const fm = parseFrontmatter(content) || {};
    const skillDir = dirname(filePath);
    const name = fm.name || basename(skillDir);
    const metadata = fm.metadata || {};
    const stat = statSync(filePath);

    return {
      name,
      description: fm.description || "",
      category: metadata.category || getCategory(skillDir),
      tags: metadata.tags || [],
      author: metadata.author || "skill-library",
      version: metadata.version || "1.0.0",
      license: fm.license || "MIT",
      compatibility: fm.compatibility || "cursor",
      path: relative(ROOT, skillDir).replace(/\\/g, "/"),
      installCommand: `${CLI_INSTALL} ${name} -a cursor -y`,
      updatedAt: metadata.updated
        ? new Date(metadata.updated).toISOString()
        : stat.mtime.toISOString(),
      hasScripts: hasScripts(skillDir),
    };
  });

  skills.sort((a, b) => a.name.localeCompare(b.name));

  const catalog = {
    generatedAt: new Date().toISOString(),
    repository: "tianqi815/skill-library",
    count: skills.length,
    skills,
  };

  mkdirSync(join(ROOT, "catalog"), { recursive: true });
  writeFileSync(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  console.log(`Generated catalog with ${skills.length} skill(s) -> ${CATALOG_PATH}`);
}

main();
