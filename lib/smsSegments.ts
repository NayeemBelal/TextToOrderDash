/**
 * SMS segment counting with proper GSM-7 vs UCS-2 detection.
 *
 * Carriers bill per segment, and the encoding decides the segment size:
 *  - GSM-7 (message is all GSM 03.38 chars): 160 chars single, else 153/segment.
 *    Extension chars (^ { } \ [ ] ~ | € and form-feed) cost 2 septets each.
 *  - UCS-2 (any non-GSM char, e.g. an emoji or a "—" em dash): 70 UTF-16 code
 *    units single, else 67/segment.
 *
 * Pass the RENDERED message (placeholders already substituted) so the count
 * matches what actually sends.
 */

const GSM_BASIC = new Set(
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡" +
    "ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà",
);
const GSM_EXTENDED = new Set("^{}\\[~]|€\f");

export type SmsEncoding = "GSM-7" | "UCS-2";

export interface SegmentInfo {
  chars: number; // user-visible character count (emoji = 1)
  segments: number;
  encoding: SmsEncoding;
}

export function countSegments(text: string): SegmentInfo {
  const codepoints = [...text];

  let gsm = true;
  let septets = 0;
  for (const ch of codepoints) {
    if (GSM_BASIC.has(ch)) septets += 1;
    else if (GSM_EXTENDED.has(ch)) septets += 2;
    else {
      gsm = false;
      break;
    }
  }

  if (gsm) {
    const segments = septets <= 160 ? 1 : Math.ceil(septets / 153);
    return { chars: codepoints.length, segments: Math.max(1, segments), encoding: "GSM-7" };
  }

  // UCS-2 is billed in UTF-16 code units (a non-BMP emoji is 2 units).
  const units = text.length;
  const segments = units <= 70 ? 1 : Math.ceil(units / 67);
  return { chars: codepoints.length, segments: Math.max(1, segments), encoding: "UCS-2" };
}
