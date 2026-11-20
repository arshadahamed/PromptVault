const HEIGHTS = [210, 260, 290, 220, 270, 310, 195, 250, 235];

export function SkeletonCard({ index = 0 }: { index?: number }) {
  const h = HEIGHTS[index % HEIGHTS.length];
  return (
    <div
      className="skeleton w-full break-inside-avoid mb-3.5"
      style={{
        height: `${h}px`,
        border: '1px solid var(--border-default)',
      }}
    />
  );
}
