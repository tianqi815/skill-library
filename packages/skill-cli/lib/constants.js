import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const DEFAULT_REPO = "tianqi815/skill-library";
export const CATALOG_URL =
  "https://raw.githubusercontent.com/tianqi815/skill-library/main/catalog/skills.json";

function readLocalCatalog() {
  const candidates = [
    join(__dirname, "..", "catalog.json"),
    join(__dirname, "..", "..", "..", "catalog", "skills.json"),
    join(process.cwd(), "catalog", "skills.json"),
  ];

  for (const filePath of candidates) {
    if (existsSync(filePath)) {
      return JSON.parse(readFileSync(filePath, "utf8"));
    }
  }

  return null;
}

export function printHelp() {
  console.log(`
@tianqi815/skill-cli - Install skills from tianqi815/skill-library

Usage:
  skill-cli add <skill-name> [options]   Install a skill
  skill-cli list                         List available skills
  skill-cli search <keyword>             Search skills by keyword
  skill-cli help                         Show this help

Add options:
  -g, --global                           Install globally (~/.cursor/skills/)
  -a, --agent <name>                     Target agent (default: cursor)
  -y, --yes                              Skip prompts

Examples:
  npx @tianqi815/skill-cli add code-review
  npx @tianqi815/skill-cli add oidc-integration -g
  npx @tianqi815/skill-cli search auth
`);
}

export async function fetchCatalog() {
  try {
    const res = await fetch(CATALOG_URL);
    if (res.ok) {
      return res.json();
    }
  } catch {
    // fall through to local catalog
  }

  const local = readLocalCatalog();
  if (local) {
    return local;
  }

  throw new Error("Failed to fetch catalog (remote and local unavailable)");
}

export function filterSkills(skills, keyword) {
  const q = keyword.toLowerCase();
  return skills.filter((skill) => {
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
}

export function printSkillList(skills) {
  if (skills.length === 0) {
    console.log("No skills found.");
    return;
  }
  for (const skill of skills) {
    const tags = (skill.tags || []).slice(0, 4).join(", ");
    console.log(`- ${skill.name} [${skill.category}]${tags ? ` (${tags})` : ""}`);
    console.log(`  ${skill.description.slice(0, 120)}${skill.description.length > 120 ? "..." : ""}`);
  }
}
