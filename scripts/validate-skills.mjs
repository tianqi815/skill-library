#!/usr/bin/env node

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, dirname, basename, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SKILLS_ROOT = join(ROOT, "skills");

const NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const SECRET_PATTERNS = [
  /AKIA[0-9A-Z]{16}/,
  /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /(?:client_secret|api_key|password)\s*[:=]\s*['"][^'"]{8,}['"]/i,
  /ghp_[a-zA-Z0-9]{20,}/,
  /sk-[a-zA-Z0-9]{20,}/,
];

const errors = [];
const warnings = [];

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

function parseFrontmatter(content, filePath) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    errors.push(`${filePath}: missing YAML frontmatter`);
    return null;
  }
  try {
    return parseYaml(match[1]);
  } catch (err) {
    errors.push(`${filePath}: invalid YAML frontmatter (${err.message})`);
    return null;
  }
}

function validateSkillFile(filePath) {
  const rel = relative(ROOT, filePath);
  const skillDir = dirname(filePath);
  const folderName = basename(skillDir);
  const content = readFileSync(filePath, "utf8");
  const body = content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");

  const backslashPathPattern = /(?:^|\s|`\()[^\n`]*\\(?:scripts|src|references|assets|\.cursor)[^\n`\\]*(?:\)|`|\s|$)/m;
  if (backslashPathPattern.test(content)) {
    errors.push(`${rel}: Windows-style backslash paths are not allowed`);
  }

  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(content)) {
      errors.push(`${rel}: possible secret detected (${pattern})`);
    }
  }

  const fm = parseFrontmatter(content, rel);
  if (!fm) return;

  if (!fm.name) {
    errors.push(`${rel}: missing required field "name"`);
  } else {
    if (fm.name.length > 64) {
      errors.push(`${rel}: name exceeds 64 characters`);
    }
    if (!NAME_PATTERN.test(fm.name)) {
      errors.push(`${rel}: name must be kebab-case lowercase (${fm.name})`);
    }
    if (fm.name !== folderName) {
      errors.push(
        `${rel}: name "${fm.name}" must match folder name "${folderName}"`
      );
    }
  }

  if (!fm.description || typeof fm.description !== "string") {
    errors.push(`${rel}: missing required field "description"`);
  } else if (fm.description.trim().length === 0) {
    errors.push(`${rel}: description must not be empty`);
  } else if (fm.description.length > 1024) {
    errors.push(`${rel}: description exceeds 1024 characters`);
  }

  const lines = body.split("\n").length;
  if (lines > 500) {
    warnings.push(`${rel}: body has ${lines} lines (recommended <= 500)`);
  }

  const scriptsDir = join(skillDir, "scripts");
  if (existsSync(scriptsDir) && statSync(scriptsDir).isDirectory()) {
    const scriptFiles = readdirSync(scriptsDir).filter((f) => !f.startsWith("."));
    if (scriptFiles.length > 0) {
      warnings.push(
        `${rel}: contains scripts/ (${scriptFiles.join(", ")}) - requires manual security review`
      );
    }
  }
}

function main() {
  if (!existsSync(SKILLS_ROOT)) {
    console.error("skills/ directory not found");
    process.exit(1);
  }

  const skillFiles = walkSkillFiles(SKILLS_ROOT);
  if (skillFiles.length === 0) {
    errors.push("No SKILL.md files found under skills/");
  }

  const seenNames = new Map();

  for (const file of skillFiles) {
    validateSkillFile(file);

    const content = readFileSync(file, "utf8");
    const fm = parseFrontmatter(content, relative(ROOT, file));
    if (fm?.name) {
      const rel = relative(ROOT, file);
      if (seenNames.has(fm.name)) {
        errors.push(
          `Duplicate skill name "${fm.name}" in ${rel} and ${seenNames.get(fm.name)}`
        );
      } else {
        seenNames.set(fm.name, rel);
      }
    }
  }

  for (const w of warnings) {
    console.warn(`WARN: ${w}`);
  }

  if (errors.length > 0) {
    for (const e of errors) {
      console.error(`ERROR: ${e}`);
    }
    console.error(`\nValidation failed with ${errors.length} error(s).`);
    process.exit(1);
  }

  console.log(`Validated ${skillFiles.length} skill(s) successfully.`);
}

main();
