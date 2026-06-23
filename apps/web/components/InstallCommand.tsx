"use client";

import { useState } from "react";

type InstallCommandProps = {
  command: string;
  className?: string;
};

export function InstallCommand({ command, className = "" }: InstallCommandProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
