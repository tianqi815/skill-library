"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="mb-4 mt-0 text-2xl font-bold tracking-tight text-slate-50">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-3 mt-8 border-b border-card-border pb-2 text-xl font-semibold text-slate-100">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-6 text-lg font-semibold text-slate-100">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="mb-2 mt-5 text-base font-semibold text-slate-200">{children}</h4>
  ),
  p: ({ children }) => (
    <p className="mb-4 leading-7 text-slate-300 last:mb-0">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="mb-4 list-disc space-y-1.5 pl-6 text-slate-300 marker:text-accent/70">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-4 list-decimal space-y-1.5 pl-6 text-slate-300 marker:text-accent/70">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-7">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-4 rounded-r-lg border-l-4 border-accent/60 bg-accent/5 px-4 py-3 text-slate-300">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-8 border-card-border" />,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-medium text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent"
    >
      {children}
    </a>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-slate-100">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-slate-200">{children}</em>,
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-xl border border-card-border">
      <table className="w-full min-w-[480px] text-left text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-pill/80 text-slate-200">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y divide-card-border">{children}</tbody>,
  tr: ({ children }) => <tr className="hover:bg-pill/30">{children}</tr>,
  th: ({ children }) => (
    <th className="px-4 py-2.5 font-semibold whitespace-nowrap">{children}</th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-2.5 align-top leading-6 text-slate-300">{children}</td>
  ),
  pre: ({ children }) => (
    <pre className="my-4 overflow-x-auto rounded-xl border border-card-border bg-[#080d14] p-4 font-mono text-[13px] leading-6 text-slate-200">
      {children}
    </pre>
  ),
  code: ({ className, children }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return <code className={`${className} block whitespace-pre text-inherit`}>{children}</code>;
    }
    return (
      <code className="rounded-md bg-pill px-1.5 py-0.5 font-mono text-[0.88em] text-accent">
        {children}
      </code>
    );
  },
};

type MarkdownPreviewProps = {
  content: string;
  className?: string;
};

export function MarkdownPreview({ content, className = "" }: MarkdownPreviewProps) {
  return (
    <article className={`file-preview-prose ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </article>
  );
}
