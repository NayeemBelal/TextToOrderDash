"use client";

/** A pulsing placeholder bar — drop in wherever real content is still loading. */
export function Skeleton({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return <div className={`animate-pulse bg-capy-surface-2 rounded ${className}`} style={style} />;
}
