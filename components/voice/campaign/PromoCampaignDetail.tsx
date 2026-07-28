"use client";

import { useEffect, useState } from "react";
import { fetchPromoDetail, type PromoDetail } from "@/lib/promoCampaignApi";
import { Skeleton } from "@/components/ui/Skeleton";

function DeliveryBadge({ status }: { status: string | null }) {
  if (status === "delivered") {
    return <span className="text-[11px] px-1.5 py-0.5 rounded font-medium bg-capy-green-light text-capy-green-dark">Delivered</span>;
  }
  if (status === "delivery_failed" || status === "sending_failed") {
    return <span className="text-[11px] px-1.5 py-0.5 rounded font-medium bg-red-100 text-red-700">Failed</span>;
  }
  return <span className="text-[11px] px-1.5 py-0.5 rounded font-medium bg-slate-100 text-slate-500">Sent</span>;
}

export function PromoCampaignDetail({
  restaurantId,
  promoId,
  onExit,
}: {
  restaurantId: string;
  promoId: string;
  onExit: () => void;
}) {
  const [detail, setDetail] = useState<PromoDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPromoDetail(restaurantId, promoId)
      .then(setDetail)
      .catch(() => setError("Couldn't load this campaign."));
  }, [restaurantId, promoId]);

  return (
    <div className="p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <button
          onClick={onExit}
          className="text-xs font-semibold text-capy-muted hover:text-capy-text transition-colors"
        >
          ← All Campaigns
        </button>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {!error && !detail && (
          <div className="space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {detail && (
          <>
            <div>
              <p className="card-heading text-base">Promotional Message</p>
              <p className="text-xs text-capy-muted mt-1 whitespace-pre-wrap">{detail.message}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white rounded-2xl border border-capy-border shadow-sm p-4">
                <p className="section-label">Status</p>
                <p className="text-lg font-bold text-capy-text mt-1 capitalize">{detail.status}</p>
              </div>
              <div className="bg-white rounded-2xl border border-capy-border shadow-sm p-4">
                <p className="section-label">Delivered</p>
                <p className="text-lg font-bold text-capy-text mt-1">{detail.delivered}</p>
              </div>
              <div className="bg-white rounded-2xl border border-capy-border shadow-sm p-4">
                <p className="section-label">Failed</p>
                <p className="text-lg font-bold text-capy-text mt-1">{detail.failed}</p>
              </div>
              <div className="bg-white rounded-2xl border border-capy-border shadow-sm p-4">
                <p className="section-label">Unconfirmed</p>
                <p className="text-lg font-bold text-capy-text mt-1">{detail.unconfirmed}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-capy-border shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-capy-border">
                <h3 className="text-sm font-semibold text-capy-text">Recipients</h3>
              </div>
              <div className="max-h-[60vh] overflow-y-auto divide-y divide-capy-border/60">
                {detail.recipients.length === 0 ? (
                  <p className="text-xs text-capy-muted text-center py-8">No sends yet.</p>
                ) : (
                  detail.recipients.map((r, i) => (
                    <div key={`${r.customer_id}-${i}`} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-capy-text truncate">{r.name || r.phone || "Unknown"}</p>
                        <p className="text-xs text-capy-muted font-mono">{r.phone}</p>
                      </div>
                      <DeliveryBadge status={r.delivery_status} />
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
