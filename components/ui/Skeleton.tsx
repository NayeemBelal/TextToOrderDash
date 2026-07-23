"use client";

/** A pulsing placeholder bar — drop in wherever real content is still loading. */
export function Skeleton({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return <div className={`animate-pulse bg-slate-100 rounded ${className}`} style={style} />;
}
