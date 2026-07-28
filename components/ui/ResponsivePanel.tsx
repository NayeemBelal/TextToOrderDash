"use client";

/**
 * A panel that's a bottom sheet on mobile (below `sm`) and a right-side panel
 * on desktop (`sm` and up) — same backdrop/close-button conventions as the
 * app's existing desktop-only panels (OrderDetailDrawer, ScheduleReminderPanel,
 * CustomerGroupsPanel), just with responsive positioning added.
 */
export function ResponsivePanel({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden />
      <div
        className="relative w-full max-h-[50vh] sm:max-h-none sm:w-1/2 sm:h-full bg-white shadow-xl flex flex-col rounded-t-2xl sm:rounded-none animate-[slideup_0.18s_ease-out] sm:animate-[slidein_0.18s_ease-out]"
      >
        <style>{`
          @keyframes slidein { from { transform: translateX(16px); opacity: .6 } to { transform: none; opacity: 1 } }
          @keyframes slideup { from { transform: translateY(16px); opacity: .6 } to { transform: none; opacity: 1 } }
        `}</style>

        <div className="flex items-center justify-between px-5 py-4 border-b border-capy-border flex-shrink-0">
          <h2 className="text-base font-bold text-capy-text">{title}</h2>
          <button onClick={onClose} className="text-capy-muted hover:text-capy-text" aria-label="Close">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
