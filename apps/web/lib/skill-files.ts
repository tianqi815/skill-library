import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { parse as parseYaml } from "yaml";

const REPO_ROOT = join(process.cwd(), "..", "..");

const TEXT_EXTENSIONS = new Set([
  ".md",
  ".txt",
  ".json",
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".py",
  ".yaml",
  ".yml",
  ".mjs",
  ".cjs",
  ".css",
  ".html",
  ".sh",
  ".sql",
]);

const MAX_PREVIEW_BYTES = 512 * 1024;

export type FileTreeNode = {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  children?: FileTreeNode[];
};

export type SkillFilePreview = {
  path: string;
  name: string;
  extension: string;
  size: number;
  content: string;
  previewable: boolean;
  frontmatter?: Record<string, unknown>;
  markdownBody?: string;
};

export type SkillFilesBundle = {
  tree: FileTreeNode[];
  files: Record<string, SkillFilePreview>;
  fileCount: number;
  defaultFile: string;
};

function sortNodes(nodes: FileTreeNode[]): FileTreeNode[] {
  return nodes.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "directory" ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}

function walkDirectory(absDir: string, relDir: string): FileTreeNode[] {
  const nodes: FileTreeNode[] = [];

  for (const entry of readdirSync(absDir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;

    const relPath = relDir ? `${relDir}/${entry.name}` : entry.name;
    const absPath = join(absDir, entry.name);

    if (entry.isDirectory()) {
      nodes.push({
        name: entry.name,
        path: relPath,
        type: "directory",
        children: sortNodes(walkDirectory(absPath, relPath)),
      });
    } else if (entry.isFile()) {
      const stat = statSync(absPath);
      nodes.push({
        name: entry.name,
        path: relPath,
        type: "file",
        size: stat.size,
      });
    }
  }

  return sortNodes(nodes);
}

function parseSkillFrontmatter(content: string) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return null;

  try {
    return {
      frontmatter: parseYaml(match[1]) as Record<string, unknown>,
      markdownBody: match[2],
    };
  } catch {
    return null;
  }
}

function readFilePreview(absPath: string, relPath: string): SkillFilePreview {
  const stat = statSync(absPath);
  const name = relPath.split("/").pop() || relPath;
  const extension = name.includes(".") ? `.${name.split(".").pop()}` : "";

  if (stat.size > MAX_PREVIEW_BYTES || !TEXT_EXTENSIONS.has(extension.toLowerCase())) {
    return {
      path: relPath,
      name,
      extension,
      size: stat.size,
      content: "",
      previewable: false,
    };
  }

  const content = readFileSync(absPath, "utf8");
  const preview: SkillFilePreview = {
    path: relPath,
    name,
    extension,
    size: stat.size,
    content,
    previewable: true,
  };

  if (name === "SKILL.md") {
    const parsed = parseSkillFrontmatter(content);
    if (parsed) {
      preview.frontmatter = parsed.frontmatter;
      preview.markdownBody = parsed.markdownBody;
    }
  }

  return preview;
}

function collectFilePaths(nodes: FileTreeNode[]): string[] {
  const paths: string[] = [];
  for (const node of nodes) {
    if (node.type === "file") {
      paths.push(node.path);
    } else if (node.children) {
      paths.push(...collectFilePaths(node.children));
    }
  }
  return paths;
}

export function getSkillFilesBundle(relativeSkillPath: string): SkillFilesBundle {
  const skillRoot = join(REPO_ROOT, relativeSkillPath);

  if (!existsSync(skillRoot)) {
    return { tree: [], files: {}, fileCount: 0, defaultFile: "SKILL.md" };
  }

  const tree = walkDirectory(skillRoot, "");
  const filePaths = collectFilePaths(tree);
  const files: Record<string, SkillFilePreview> = {};

  for (const relPath of filePaths) {
    files[relPath] = readFilePreview(join(skillRoot, relPath), relPath);
  }

  const defaultFile = filePaths.includes("SKILL.md")
    ? "SKILL.md"
    : filePaths[0] || "SKILL.md";

  return {
    tree,
    files,
    fileCount: filePaths.length,
    defaultFile,
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
