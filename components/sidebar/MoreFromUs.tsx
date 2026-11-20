import { ExternalLink } from 'lucide-react';

const LINKS = [
  { label: 'MCP Server',     href: 'https://github.com/jau123/MeiGen-AI-Design-MCP' },
  { label: 'OpenClaw Skill', href: 'https://clawhub.ai/jau123/creative-toolkit' },
  { label: 'Figma Plugin',   href: 'https://www.figma.com/community/plugin/1539963026393306817' },
];

export function MoreFromUs() {
  return (
    <div className="px-2">
      <p
        className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider"
        style={{ color: 'var(--fg-subtle)' }}
      >
        More from us
      </p>
      <ul className="flex flex-col gap-0.5">
        {LINKS.map(({ label, href }) => (
          <li key={label}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 px-3 py-2 rounded-[10px] text-sm transition-colors theme-surface-hover"
              style={{ color: 'var(--fg-secondary)' }}
            >
              <span className="flex-1">{label}</span>
              <ExternalLink
                size={13}
                className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150"
                style={{ color: 'var(--fg-subtle)' }}
              />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
