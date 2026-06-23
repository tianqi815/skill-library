#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import {
  DEFAULT_REPO,
  fetchCatalog,
  filterSkills,
  printHelp,
  printSkillList,
} from "../lib/constants.js";

function runSkills(args) {
  const result = spawnSync("npx", ["--yes", "skills", ...args], {
    stdio: "inherit",
    shell: true,
  });
  if (result.error) {
    console.error(`Failed to run skills CLI: ${result.error.message}`);
    process.exit(1);
  }
  process.exit(result.status ?? 1);
}

function parseAddArgs(argv) {
  const options = { global: false, agent: "cursor", yes: true, skillName: null };
  const positional = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "-g" || arg === "--global") {
      options.global = true;
    } else if (arg === "-y" || arg === "--yes") {
      options.yes = true;
    } else if (arg === "-a" || arg === "--agent") {
      options.agent = argv[i + 1];
      i += 1;
    } else if (!arg.startsWith("-")) {
      positional.push(arg);
    }
  }

  options.skillName = positional[0] || null;
  return options;
}

function cmdAdd(argv) {
  const { global: isGlobal, agent, yes, skillName } = parseAddArgs(argv);

  if (!skillName) {
    console.error("Error: skill name required. Example: skill-cli add code-review");
    process.exit(1);
  }

  const args = ["add", DEFAULT_REPO, "--skill", skillName, "-a", agent];
  if (isGlobal) args.push("-g");
  if (yes) args.push("-y");

  console.log(`Installing skill "${skillName}" from ${DEFAULT_REPO}...`);
  runSkills(args);
}

async function cmdList() {
  try {
    const catalog = await fetchCatalog();
    printSkillList(catalog.skills || []);
    console.log(`\nTotal: ${catalog.count ?? catalog.skills?.length ?? 0} skill(s)`);
  } catch (err) {
    console.error(`List failed: ${err.message}`);
    console.log(`Fallback: npx skills add ${DEFAULT_REPO} --list`);
    runSkills(["add", DEFAULT_REPO, "--list"]);
  }
}

async function cmdSearch(keyword) {
  if (!keyword) {
    console.error("Error: search keyword required. Example: skill-cli search oidc");
    process.exit(1);
  }

  try {
    const catalog = await fetchCatalog();
    const matches = filterSkills(catalog.skills || [], keyword);
    printSkillList(matches);
    console.log(`\nMatches: ${matches.length}`);
  } catch (err) {
    console.error(`Search failed: ${err.message}`);
    process.exit(1);
  }
}

async function main() {
  const [, , command, ...rest] = process.argv;

  switch (command) {
    case "add":
    case "install":
      cmdAdd(rest);
      break;
    case "list":
    case "ls":
      await cmdList();
      break;
    case "search":
    case "find":
      await cmdSearch(rest.join(" ").trim());
      break;
    case "help":
    case "-h":
    case "--help":
    case undefined:
      printHelp();
      break;
    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }
}

main();
