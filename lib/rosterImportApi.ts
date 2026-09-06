/**
 * Typed client for spreadsheet roster imports
 * (belan-marketing-backend `POST /api/marketing/roster/upload` and
 * `GET /api/marketing/roster/imports`).
 *
 * The upload endpoint SENDS NOTHING — it parses the file, checks it against
 * who has already been contacted, and stages it. The returned `import_id` is
 * what the opt-in blast takes to actually text those contacts, so the owner
 * always sees a preview before anything leaves the building.
 */
import { marketingApiFetch, marketingApiUpload } from "@/lib/api";

export interface RosterContact {
  phone_number: string;
  first_name: string;
  last_name: string;
}

export interface RosterRowError {
  /** Row number as it appears in the owner's spreadsheet. */
  row: number;
  value: string;
  reason: string;
}

export interface RosterUploadResult {
  import_id: string;
  filename: string;
  /** Non-blank rows found in the file. */
  total_rows: number;
  /** Rows that produced a usable, unique phone number. */
  valid: number;
  /** Rows we couldn't read a phone number from (detailed in `errors`). */
  invalid: number;
  /** Numbers that appeared more than once in the file. */
  duplicates: number;
  /** Of the valid contacts, how many have never been contacted. */
  new: number;
  /** ...and how many were already opted in, opted out, or blasted before. */
  already_contacted: number;
  errors: RosterRowError[];
  /** First few parsed contacts, so the owner can confirm the right column
   *  was picked up before blasting the whole list. */
  sample: RosterContact[];
}

export interface RosterImportSummary {
  id: string;
  filename: string | null;
  stats: Partial<
    Pick<
      RosterUploadResult,
      "total_rows" | "valid" | "invalid" | "duplicates" | "new" | "already_contacted"
    >
  >;
  /** When this upload's blast was sent. Null means still unsent. */
  consumed_at: string | null;
  created_at: string;
}

export function uploadRoster(
  restaurantId: string,
  file: File,
): Promise<RosterUploadResult> {
  const form = new FormData();
  form.append("restaurant_id", restaurantId);
  form.append("file", file);
  return marketingApiUpload<RosterUploadResult>("/api/marketing/roster/upload", form);
}

export function listRosterImports(
  restaurantId: string,
): Promise<{ imports: RosterImportSummary[] }> {
  return marketingApiFetch<{ imports: RosterImportSummary[] }>(
    `/api/marketing/roster/imports?restaurant_id=${restaurantId}`,
  );
}
