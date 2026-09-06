"use client";

import { useRef, useState } from "react";
import {
  uploadRoster,
  type RosterUploadResult,
} from "@/lib/rosterImportApi";

interface Props {
  restaurantId: string;
  /** The staged upload, lifted so the opt-in panel's Send button can blast it. */
  result: RosterUploadResult | null;
  onResult: (result: RosterUploadResult | null) => void;
}

const ACCEPT = ".xlsx,.xlsm,.csv,.txt";

/**
 * Upload a spreadsheet of phone numbers as an opt-in blast roster.
 *
 * The alternative to "Scan Clover", and the only path for a merchant who
 * isn't on Clover at all. Uploading SENDS NOTHING — the file is parsed and
 * checked against everyone already contacted, and this card shows what would
 * happen; the panel's existing Send button does the sending.
 *
 * The counts matter more than they look. An owner who exports 900 contacts
 * and sees "312 new" needs to understand the other 588 aren't lost, they're
 * already on the list — and an owner whose column headers confused the parser
 * needs to see that in the sample rows before texting 900 people.
 */
export function RosterUploadCard({ restaurantId, result, onResult }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setShowErrors(false);
    onResult(null);
    try {
      onResult(await uploadRoster(restaurantId, file));
    } catch (err) {
      // The backend's message names the actual problem with the file
      // ("we couldn't find a column of phone numbers"), which is the whole
      // point of surfacing it rather than a generic failure.
      setError(
        err instanceof Error && !err.message.startsWith("API ")
          ? err.message
          : "Couldn't read that file. Try a .xlsx or .csv export.",
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`rounded-2xl border-2 border-dashed px-4 py-5 text-center cursor-pointer transition-all ${
          dragging
            ? "border-capy-green bg-capy-green-light"
            : "border-capy-border hover:border-capy-green"
        } ${uploading ? "opacity-60 pointer-events-none" : ""}`}
      >
        <p className="text-xs font-semibold text-capy-text">
          {uploading ? "Reading your file…" : "Upload a spreadsheet"}
        </p>
        <p className="text-[11px] text-capy-muted mt-1">
          Drop an .xlsx or .csv here, or tap to choose. One column of phone
          numbers is all we need.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-xs px-3 py-2 rounded-xl">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-white rounded-2xl border border-capy-border p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-capy-text truncate">
                {result.filename}
              </p>
              <p className="text-[11px] text-capy-muted">
                {result.valid} contact{result.valid !== 1 ? "s" : ""} read from{" "}
                {result.total_rows} row{result.total_rows !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={() => onResult(null)}
              className="text-xs text-capy-muted hover:text-capy-text shrink-0"
            >
              Clear
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-capy-green-light rounded-xl px-3 py-2">
              <p className="text-lg font-bold text-capy-green-dark leading-none">
                {result.new}
              </p>
              <p className="text-[11px] text-capy-green-dark/80 mt-1">
                new — will be texted
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl px-3 py-2">
              <p className="text-lg font-bold text-capy-muted leading-none">
                {result.already_contacted}
              </p>
              <p className="text-[11px] text-capy-muted mt-1">
                already on your list
              </p>
            </div>
          </div>

          {result.sample.length > 0 && (
            <div>
              <p className="section-label mb-1">We read these as</p>
              <div className="space-y-0.5">
                {result.sample.map((c) => (
                  <p
                    key={c.phone_number}
                    className="text-[11px] text-capy-muted font-mono truncate"
                  >
                    {c.phone_number}
                    {(c.first_name || c.last_name) &&
                      ` · ${[c.first_name, c.last_name].filter(Boolean).join(" ")}`}
                  </p>
                ))}
              </div>
            </div>
          )}

          {(result.invalid > 0 || result.duplicates > 0) && (
            <div>
              <button
                onClick={() => setShowErrors((v) => !v)}
                className="text-[11px] text-capy-muted hover:text-capy-text"
              >
                {result.duplicates > 0 &&
                  `${result.duplicates} duplicate${result.duplicates !== 1 ? "s" : ""} skipped`}
                {result.duplicates > 0 && result.invalid > 0 && " · "}
                {result.invalid > 0 &&
                  `${result.invalid} row${result.invalid !== 1 ? "s" : ""} we couldn't read`}
                {result.errors.length > 0 && (showErrors ? " ▴" : " ▾")}
              </button>
              {showErrors && result.errors.length > 0 && (
                <div className="mt-1.5 space-y-0.5 max-h-32 overflow-y-auto">
                  {result.errors.map((e) => (
                    <p
                      key={`${e.row}-${e.value}`}
                      className="text-[11px] text-capy-muted"
                    >
                      Row {e.row}
                      {e.value && `: “${e.value}”`} — {e.reason}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {result.new === 0 && (
            <p className="text-[11px] text-capy-muted">
              Everyone in this file is already on your list — nothing to send.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
