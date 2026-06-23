"use client";

import { useState } from "react";

type InstallCommandProps = {
  command: string;
  className?: string;
};

async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to legacy copy
    }
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export function InstallCommand({ command, className = "" }: InstallCommandProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  async function copy() {
    setCopyError(false);
    const ok = await copyToClipboard(command);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }
    setCopyError(true);
    setTimeout(() => setCopyError(false), 3000);
  }

  return (
    <div
      className={`rounded-xl border border-card-border bg-[#0f172a] p-4 ${className}`}
    >
      <div className="mb-2 text-xs uppercase tracking-wide text-muted">
        Install command
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <code className="flex-1 overflow-x-auto font-mono text-sm text-accent">
          {command}
        </code>
        <button
          type="button"
          onClick={copy}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-[#052e1a] transition hover:bg-accent-muted"
        >
          {copied ? "Copied" : copyError ? "Select & copy" : "Copy"}
        </button>
      </div>
      {copyError && (
        <p className="mt-2 text-xs text-amber-300">
          Auto-copy unavailable in this browser. Select the command above and copy manually (Ctrl+C).
        </p>
      )}
    </div>
  );
}
