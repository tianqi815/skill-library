"use client";

import { useMemo, useState } from "react";
import { ChevronIcon, FolderIcon, getFileIcon } from "@/components/FileTreeIcons";
import { MarkdownPreview } from "@/components/MarkdownPreview";
import type { FileTreeNode, SkillFilePreview, SkillFilesBundle } from "@/lib/skill-files";

type SkillFileBrowserProps = {
  bundle: SkillFilesBundle;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function flattenExpandedPaths(nodes: FileTreeNode[]): Set<string> {
  const expanded = new Set<string>();
  for (const node of nodes) {
    if (node.type === "directory") {
      expanded.add(node.path);
      if (node.children) {
        for (const childPath of flattenExpandedPaths(node.children)) {
          expanded.add(childPath);
        }
      }
    }
  }
  return expanded;
}

function FileTreeItem({
  node,
  depth,
  selectedPath,
  expandedDirs,
  onSelectFile,
  onToggleDir,
}: {
  node: FileTreeNode;
  depth: number;
  selectedPath: string;
  expandedDirs: Set<string>;
  onSelectFile: (path: string) => void;
  onToggleDir: (path: string) => void;
}) {
  const isDir = node.type === "directory";
  const isExpanded = isDir && expandedDirs.has(node.path);
  const isSelected = !isDir && selectedPath === node.path;

  return (
    <>
      <button
        type="button"
        onClick={() => (isDir ? onToggleDir(node.path) : onSelectFile(node.path))}
        className={`group flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm transition ${
          isSelected
            ? "bg-accent/12 text-accent ring-1 ring-accent/25"
            : "text-slate-300 hover:bg-pill/70 hover:text-foreground"
        }`}
        style={{ paddingLeft: `${depth * 18 + 8}px` }}
      >
        <span className="flex w-4 shrink-0 items-center justify-center">
          {isDir ? (
            <ChevronIcon expanded={isExpanded} />
          ) : (
            <span className="h-3.5 w-3.5" />
          )}
        </span>

        <span className="flex w-5 shrink-0 items-center justify-center">
          {isDir ? <FolderIcon open={isExpanded} /> : getFileIcon(node.name)}
        </span>

        <span className="min-w-0 flex-1 truncate text-[13px]">{node.name}</span>

        {!isDir && node.size !== undefined && (
          <span className={`shrink-0 pl-2 text-xs tabular-nums ${isSelected ? "text-accent/80" : "text-muted"}`}>
            {formatFileSize(node.size)}
          </span>
        )}
      </button>

      {isDir && isExpanded && node.children?.map((child) => (
        <FileTreeItem
          key={child.path}
          node={child}
          depth={depth + 1}
          selectedPath={selectedPath}
          expandedDirs={expandedDirs}
          onSelectFile={onSelectFile}
          onToggleDir={onToggleDir}
        />
      ))}
    </>
  );
}

function FrontmatterTable({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data).filter(([, value]) => value !== undefined && value !== null);

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-card-border">
      <table className="w-full text-sm">
        <tbody>
          {entries.map(([key, value]) => (
            <tr key={key} className="border-b border-card-border last:border-b-0">
              <td className="w-40 bg-pill/60 px-4 py-3 align-top font-medium text-slate-400">
                {key}
              </td>
              <td className="px-4 py-3 align-top leading-6 text-slate-200">
                {typeof value === "object" ? (
                  <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-[#080d14] p-3 font-mono text-xs leading-5 text-slate-300">
                    {JSON.stringify(value, null, 2)}
                  </pre>
                ) : (
                  <span className="break-words">{String(value)}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CodePreview({ content, language }: { content: string; language: string }) {
  const lines = useMemo(() => content.replace(/\r\n/g, "\n").split("\n"), [content]);

  return (
    <div className="overflow-hidden rounded-xl border border-card-border bg-[#080d14]">
      <div className="flex items-center justify-between border-b border-card-border px-4 py-2">
        <span className="font-mono text-xs text-muted">{language}</span>
        <span className="text-xs text-muted">{lines.length} lines</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse font-mono text-[13px] leading-6">
          <tbody>
            {lines.map((line, index) => (
              <tr key={index} className="hover:bg-pill/20">
                <td className="w-12 select-none border-r border-card-border/60 px-3 py-0 text-right align-top text-slate-600">
                  {index + 1}
                </td>
                <td className="whitespace-pre px-4 py-0 text-slate-200">{line || " "}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilePreview({ file }: { file: SkillFilePreview }) {
  const ext = file.extension.toLowerCase();

  if (!file.previewable) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed border-card-border p-8 text-center text-muted">
        <div>
          <p className="font-medium text-foreground">Preview not available</p>
          <p className="mt-2 text-sm leading-6">
            Binary or large file ({formatFileSize(file.size)}). Download from the repository to view.
          </p>
        </div>
      </div>
    );
  }

  if (file.name === "SKILL.md" && file.frontmatter) {
    return (
      <div>
        <FrontmatterTable data={file.frontmatter} />
        <MarkdownPreview content={file.markdownBody || ""} />
      </div>
    );
  }

  if (ext === ".md") {
    return <MarkdownPreview content={file.content} />;
  }

  if (ext === ".json") {
    let formatted = file.content;
    try {
      formatted = JSON.stringify(JSON.parse(file.content), null, 2);
    } catch {
      // keep raw
    }
    return <CodePreview content={formatted} language="json" />;
  }

  const languageMap: Record<string, string> = {
    ".js": "javascript",
    ".jsx": "jsx",
    ".ts": "typescript",
    ".tsx": "tsx",
    ".py": "python",
    ".yaml": "yaml",
    ".yml": "yaml",
    ".sh": "shell",
    ".css": "css",
    ".html": "html",
  };

  return (
    <CodePreview content={file.content} language={languageMap[ext] || ext.replace(".", "") || "text"} />
  );
}

export function SkillFileBrowser({ bundle }: SkillFileBrowserProps) {
  const [selectedPath, setSelectedPath] = useState(bundle.defaultFile);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(() =>
    flattenExpandedPaths(bundle.tree)
  );

  const selectedFile = bundle.files[selectedPath];

  const toggleDir = (path: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const fileListLabel = useMemo(
    () => `${bundle.fileCount} files`,
    [bundle.fileCount]
  );

  if (bundle.fileCount === 0) {
    return (
      <div className="rounded-2xl border border-card-border bg-card/50 p-8 text-center text-muted">
        No files found in this skill directory.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-card-border bg-[#0f1520]">
        <div className="flex items-center justify-between border-b border-card-border bg-card/80 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-slate-100">File Explorer</h2>
          <span className="text-xs text-muted">{fileListLabel}</span>
        </div>
        <div className="max-h-80 overflow-y-auto px-2 py-2">
          {bundle.tree.map((node) => (
            <FileTreeItem
              key={node.path}
              node={node}
              depth={0}
              selectedPath={selectedPath}
              expandedDirs={expandedDirs}
              onSelectFile={setSelectedPath}
              onToggleDir={toggleDir}
            />
          ))}
        </div>
      </div>

      {selectedFile && (
        <div className="rounded-2xl border border-card-border bg-card/70">
          <div className="flex items-center justify-between border-b border-card-border px-5 py-4">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex w-5 shrink-0 items-center justify-center">
                {getFileIcon(selectedFile.name, "h-4 w-4")}
              </span>
              <span className="truncate text-sm font-semibold text-slate-100">
                {selectedFile.name}
              </span>
              <span className="shrink-0 text-xs text-muted">
                {formatFileSize(selectedFile.size)}
              </span>
            </div>
            <span className="shrink-0 rounded-full border border-card-border px-2.5 py-1 text-xs text-muted">
              readonly
            </span>
          </div>
          <div className="max-h-[720px] overflow-y-auto bg-[#0a101a]/30 p-6">
            <FilePreview file={selectedFile} />
          </div>
        </div>
      )}
    </div>
  );
}
