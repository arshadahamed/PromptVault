import { ModalShell } from './ModalShell';

const SKILLS = [
  { name: 'Style Transfer',  desc: 'Apply artistic styles to any image',          emoji: '🎨' },
  { name: 'Face Preserve',   desc: 'Keep identity consistent across generations', emoji: '👤' },
  { name: 'Product Mockup',  desc: 'Place products in lifestyle scenes',           emoji: '📦' },
  { name: 'Poster Maker',    desc: 'Auto-layout text + image posters',             emoji: '🖼️' },
  { name: 'Brand KV',        desc: 'Key visual for brand campaigns',               emoji: '✨' },
  { name: 'Cinematic Grade', desc: 'Hollywood-grade color grading prompts',        emoji: '🎬' },
];

export function SkillsModal({ open }: { open: boolean }) {
  return (
    <ModalShell title="Skills" open={open}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[11px] font-semibold bg-[#1b1b1b] text-white px-2 py-0.5 rounded-full">
          New
        </span>
        <p className="text-[12px] text-[#6b7280]">
          Specialized prompt skills for your AI art workflow.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {SKILLS.map(({ name, desc, emoji }) => (
          <button
            key={name}
            className="flex flex-col gap-1.5 p-3 rounded-[12px] border border-[#e5e7eb] text-left hover:bg-[#f7f4ed] hover:border-[#d6d3cc] transition-all cursor-pointer"
          >
            <span className="text-xl">{emoji}</span>
            <p className="text-[12px] font-semibold text-[#1b1b1b]">{name}</p>
            <p className="text-[11px] text-[#6b7280] leading-snug">{desc}</p>
          </button>
        ))}
      </div>
    </ModalShell>
  );
}
