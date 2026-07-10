"use client";

import { COUPON_TYPES, COUPON_TYPE_LABEL, type CouponType } from "@/lib/marketingAnalyticsApi";

interface Props {
  selected: CouponType[];
  onChange: (next: CouponType[]) => void;
}

/**
 * Multi-toggle for coupon type (Opt-in · Winners · Losers). Filters both the
 * chart and the order list. At least one type stays selected (deselecting the
 * last is a no-op) so the view never goes empty by accident.
 */
export function CouponTypeFilter({ selected, onChange }: Props) {
  const toggle = (t: CouponType) => {
    const on = selected.includes(t);
    if (on && selected.length === 1) return; // keep at least one
    onChange(on ? selected.filter((s) => s !== t) : [...selected, t]);
  };

  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-capy-border bg-white p-1 shadow-sm">
      {COUPON_TYPES.map((t) => {
        const active = selected.includes(t);
        return (
          <button
            key={t}
            type="button"
            onClick={() => toggle(t)}
            aria-pressed={active}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              active
                ? "bg-capy-green-light text-capy-green-dark font-semibold"
                : "text-capy-muted hover:text-capy-text"
            }`}
          >
            {COUPON_TYPE_LABEL[t]}
          </button>
        );
      })}
    </div>
  );
}
