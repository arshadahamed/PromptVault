const HEIGHTS = [200, 240, 280, 220, 260, 300, 180, 250, 230];

export function SkeletonCard({ index = 0 }: { index?: number }) {
  const h = HEIGHTS[index % HEIGHTS.length];
  return (
    <div
      className="skeleton w-full break-inside-avoid mb-3"
      style={{ height: `${h}px` }}
    />
  );
}
