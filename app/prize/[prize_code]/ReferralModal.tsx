"use client";

import { useEffect, useRef, useState } from "react";

interface ReferralModalProps {
  open: boolean;
  onClose: () => void;
  restaurantName: string;
  shareImageUrl: string | null;
  bonusPercent: number;
  referredPercent: number;
  referralUrl: string;
  shareTaglines: string[];
  bonusClaimed: boolean;
}

const FAQS = (bonusPercent: number, referredPercent: number) => [
  {
    q: "How many friends can I refer?",
    a: `As many as you want! Every friend who joins with your link gets ${referredPercent}% off their first order — there's no limit on that.`,
  },
  {
    q: "How many times does my own discount go up?",
    a: "Just once per campaign.",
  },
  {
    q: "When does my bump apply?",
    a: "Automatically, the moment your friend joins — no extra steps. You'll get a text confirming it, and the same link/code just shows the new amount.",
  },
  {
    q: "Does my friend need to order anything first?",
    a: "No — they just need to join using your link. Their discount is applied right away, before they've ordered anything.",
  },
  {
    q: "What if I already used my bump?",
    a: "You can keep sharing your link — friends still get their welcome discount — but your own coupon is capped at one bump per campaign.",
  },
];

// Standard bottom-sheet enter/exit animation: mount immediately, flip
// `visible` two frames later (a single rAF can fire before the browser
// paints the hidden state, so the transition has nothing to animate from),
// then keep the node mounted for `exitMs` after `open` goes false so the
// closing transition can actually play before unmount.
function useSheetVisibility(open: boolean, exitMs = 300) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      let id2 = 0;
      const id1 = requestAnimationFrame(() => {
        id2 = requestAnimationFrame(() => setVisible(true));
      });
      return () => {
        cancelAnimationFrame(id1);
        cancelAnimationFrame(id2);
      };
    }
    setVisible(false);
    const t = setTimeout(() => setMounted(false), exitMs);
    return () => clearTimeout(t);
  }, [open, exitMs]);

  return { mounted, visible };
}

function FaqSheet({
  open, onClose, bonusPercent, referredPercent,
}: { open: boolean; onClose: () => void; bonusPercent: number; referredPercent: number }) {
  const { mounted, visible } = useSheetVisibility(open);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);

  if (!mounted) return null;

  function onDragStart(clientY: number) {
    setIsDragging(true);
    dragStartY.current = clientY;
  }
  function onDragMove(clientY: number) {
    setDragY((prev) => {
      const next = clientY - dragStartY.current;
      return next > 0 ? next : prev > 0 ? 0 : prev;
    });
  }
  function onDragEnd() {
    setIsDragging(false);
    setDragY((y) => {
      if (y > 90) onClose();
      return 0;
    });
  }

  // Base position: fully hidden below the viewport until `visible`, then
  // 0 — plus whatever the finger has dragged it down by while dragging.
  const translateY = !visible ? "100%" : `${dragY}px`;

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-end justify-center transition-colors duration-300 ${
        visible ? "bg-black/75" : "bg-black/0"
      }`}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-sm bg-black text-white rounded-t-3xl overflow-hidden flex flex-col shadow-2xl"
        style={{
          height: "62vh",
          transform: `translateY(${translateY})`,
          transition: isDragging ? "none" : "transform 300ms ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle — the only draggable region, so it doesn't fight
            with scrolling the FAQ list below it. */}
        <div
          className="flex-shrink-0 pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none"
          onPointerDown={(e) => {
            (e.target as Element).setPointerCapture(e.pointerId);
            onDragStart(e.clientY);
          }}
          onPointerMove={(e) => isDragging && onDragMove(e.clientY)}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
        >
          <div className="w-10 h-1.5 rounded-full bg-white/25 mx-auto" />
          <h3 className="text-center text-base font-bold mt-3">Frequently Asked Questions (FAQs)</h3>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="divide-y divide-white/10">
            {FAQS(bonusPercent, referredPercent).map((f) => (
              <div key={f.q} className="py-4">
                <p className="text-sm font-semibold text-white/90">{f.q}</p>
                <p className="text-sm text-white/60 mt-1.5 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReferralModal({
  open, onClose, restaurantName, shareImageUrl,
  bonusPercent, referredPercent, referralUrl, shareTaglines, bonusClaimed,
}: ReferralModalProps) {
  const [inviteState, setInviteState] = useState<"idle" | "copied">("idle");
  const { mounted, visible } = useSheetVisibility(open);
  const [faqOpen, setFaqOpen] = useState(false);

  useEffect(() => {
    if (open) setFaqOpen(false);
  }, [open]);

  if (!mounted) return null;

  async function handleInvite() {
    const tagline = shareTaglines.length > 0
      ? shareTaglines[Math.floor(Math.random() * shareTaglines.length)]
      : "You're going to love it.";
    const message =
      `Hey! I want to invite you to try ${restaurantName} with a ${referredPercent}% discount on your first order. ` +
      `${tagline} Again, all you have to do is use my unique referral link, and you'll get ${referredPercent}% OFF ` +
      `your first order: ${referralUrl}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text: message });
        return;
      } catch {
        return;
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(message);
      setInviteState("copied");
      setTimeout(() => setInviteState("idle"), 2000);
    }
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center transition-colors duration-300 ${
          visible ? "bg-black/60" : "bg-black/0"
        }`}
        onClick={onClose}
      >
        <div
          className={`w-full sm:max-w-sm bg-black text-white rounded-t-3xl sm:rounded-3xl overflow-hidden h-[95vh] sm:h-[85vh] max-h-[720px] flex flex-col shadow-2xl transition-transform duration-300 ease-out ${
            visible ? "translate-y-0" : "translate-y-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Hero */}
          <div className="relative h-40 flex-shrink-0 bg-black">
            {shareImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shareImageUrl} alt="Friends sharing food" className="w-full h-full object-cover" />
            )}
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur flex items-center justify-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/close.webp" alt="" className="w-4 h-4" />
            </button>
          </div>

          {/* Body — sized to fit without scrolling on typical phone
              viewports; overflow-y-auto stays as a safety net for short
              screens rather than something meant to be relied on. */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            <div>
              <h2 className="text-xl font-bold leading-tight text-balance">
                Want {bonusPercent}% off for referring a friend?
              </h2>
              <p className="text-xs text-white/60 mt-1.5 leading-relaxed">
                Share your link — when a friend joins {restaurantName}, your coupon gets bumped automatically.
              </p>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-white">You get</h3>
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/gift.webp" alt="" className="w-9 h-9 flex-shrink-0 object-contain" />
                <div>
                  <p className="font-semibold text-sm leading-snug">{bonusPercent}% added to your coupon</p>
                  <p className="text-xs text-white/60 leading-relaxed mt-0.5">
                    {bonusClaimed
                      ? "Already applied — thanks for spreading the word!"
                      : "Bumped automatically the first time a friend joins."}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-white">Your friend gets</h3>
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/gift-envelope.webp" alt="" className="w-9 h-9 flex-shrink-0 object-contain" />
                <div>
                  <p className="font-semibold text-sm leading-snug">{referredPercent}% off their first order</p>
                  <p className="text-xs text-white/60 leading-relaxed mt-0.5">Applied the moment they join using your link.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setFaqOpen(true)}
              className="flex items-center gap-1 text-xs font-semibold whitespace-nowrap"
            >
              Have additional questions? Read our FAQ
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/arrow-right.webp" alt="" className="w-3 h-3 flex-shrink-0" style={{ filter: "invert(1)" }} />
            </button>

            <p className="text-[11px] text-white/40 leading-relaxed">
              Max 1 bump per campaign.
            </p>
          </div>

          {/* Sticky CTA */}
          <div className="p-5 border-t border-white/10 flex-shrink-0">
            <button
              onClick={handleInvite}
              className="w-full font-bold text-base py-4 text-white transition-opacity active:opacity-80"
              style={{ backgroundColor: "#3f3f46", borderRadius: "10px" }}
            >
              {inviteState === "copied" ? "Message copied!" : "Invite Friends"}
            </button>
          </div>
        </div>
      </div>

      <FaqSheet
        open={faqOpen}
        onClose={() => setFaqOpen(false)}
        bonusPercent={bonusPercent}
        referredPercent={referredPercent}
      />
    </>
  );
}
