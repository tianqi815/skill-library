type IconProps = {
  className?: string;
};

export function ChevronIcon({ expanded, className = "h-3.5 w-3.5" }: IconProps & { expanded: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className={`${className} shrink-0 text-slate-500 transition-transform ${expanded ? "rotate-90" : ""}`}
      aria-hidden
    >
      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function FolderIcon({ open, className = "h-4 w-4" }: IconProps & { open?: boolean }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={`${className} shrink-0`} aria-hidden>
      {open ? (
        <>
          <path d="M1.5 4.5A1 1 0 012.5 3.5H6l1.2 1.2H13.5A1 1 0 0114.5 5.5V12a1 1 0 01-1 1H2.5a1 1 0 01-1-1V4.5z" fill="#FBBF24" />
          <path d="M1.5 6h13v6.5a1 1 0 01-1 1H2.5a1 1 0 01-1-1V6z" fill="#F59E0B" />
        </>
      ) : (
        <path d="M1.5 4.5A1 1 0 012.5 3.5H6l1.2 1.2H13.5A1 1 0 0114.5 5.5V12a1 1 0 01-1 1H2.5a1 1 0 01-1-1V4.5z" fill="#FBBF24" stroke="#F59E0B" strokeWidth="0.5" />
      )}
    </svg>
  );
}

function FileBadgeIcon({
  label,
  bg,
  fg,
  className = "h-4 w-4",
}: IconProps & { label: string; bg: string; fg: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={`${className} shrink-0`} aria-hidden>
      <path d="M3 1.5h6.5L13 5v9.5a1 1 0 01-1 1H3a1 1 0 01-1-1V2.5a1 1 0 011-1z" fill={bg} />
      <path d="M9 1.5V5H13" fill={fg} opacity="0.35" />
      <rect x="2" y="9" width="12" height="4.5" rx="0.5" fill={fg} opacity="0.9" />
      <text x="8" y="12.2" textAnchor="middle" fontSize="4" fontWeight="700" fill="#fff" fontFamily="ui-sans-serif, system-ui, sans-serif">
        {label}
      </text>
    </svg>
  );
}

export function getFileIcon(name: string, className?: string) {
  const ext = name.includes(".") ? name.split(".").pop()?.toLowerCase() : "";

  switch (ext) {
    case "md":
      return <FileBadgeIcon label="MD" bg="#3B82F6" fg="#1D4ED8" className={className} />;
    case "json":
      return <FileBadgeIcon label="J" bg="#F59E0B" fg="#D97706" className={className} />;
    case "py":
      return <FileBadgeIcon label="PY" bg="#22C55E" fg="#15803D" className={className} />;
    case "js":
      return <FileBadgeIcon label="JS" bg="#EAB308" fg="#CA8A04" className={className} />;
    case "jsx":
      return <FileBadgeIcon label="JX" bg="#38BDF8" fg="#0284C7" className={className} />;
    case "ts":
      return <FileBadgeIcon label="TS" bg="#2563EB" fg="#1E40AF" className={className} />;
    case "tsx":
      return <FileBadgeIcon label="TX" bg="#6366F1" fg="#4338CA" className={className} />;
    case "yaml":
    case "yml":
      return <FileBadgeIcon label="YML" bg="#A855F7" fg="#7E22CE" className={className} />;
    case "txt":
      return <FileBadgeIcon label="TXT" bg="#64748B" fg="#475569" className={className} />;
    case "sh":
      return <FileBadgeIcon label="SH" bg="#64748B" fg="#334155" className={className} />;
    case "css":
      return <FileBadgeIcon label="CSS" bg="#EC4899" fg="#BE185D" className={className} />;
    case "html":
      return <FileBadgeIcon label="HTML" bg="#F97316" fg="#C2410C" className={className} />;
    default:
      return (
        <svg viewBox="0 0 16 16" fill="none" className={`${className || "h-4 w-4"} shrink-0`} aria-hidden>
          <path d="M3 1.5h6.5L13 5v9.5a1 1 0 01-1 1H3a1 1 0 01-1-1V2.5a1 1 0 011-1z" fill="#64748B" />
          <path d="M9 1.5V5H13" fill="#94A3B8" />
        </svg>
      );
  }
}
