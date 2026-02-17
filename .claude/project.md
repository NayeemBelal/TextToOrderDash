# TextToOrder Dashboard - MVP Specification

## 1. Project Overview

**Goal:** Create a "Command and Control" mobile-first dashboard for restaurant owners.
**Core Philosophy:** High-energy, financial-style visualization that treats restaurant revenue like stock performance.
**Target User:** Restaurant owners who are busy, on their feet, and need instant gratification/validation of the system's value.

---

## 2. Feature I: The "Main Event" (Revenue & Trends)

_The hero section. Immediate financial visibility with a high-fidelity, interactive chart._

### A. Visual Design (The "Robinhood" Look)

- **The Big Number:** Massive, bold font displaying Total Revenue for the selected period (e.g., `$4,642.64`).
- **The Pulse (Delta):** Directly below the main number.
  - Format: `+$173.22 (3.60%)`
  - **Color Logic:**
    - **Green:** Growth (Current period > Previous period).
    - **Red/Orange:** Decline (Current period < Previous period).
- **The Chart:**
  - Minimalist line graph (Sparkline style).
  - No grid lines, no axes labels.
  - **Interaction:** "Scrubbing" (press and drag) reveals a tooltip with the exact timestamp and revenue amount for that specific point on the line.

### B. Time Filters (The Controls)

Located immediately below the chart as a "Pill Selector." Changing a filter updates **all** dashboard widgets (Chart, Insights, Top Movers).

- **1H (Live):** Real-time view. Best for monitoring the current lunch/dinner rush.
- **24H:** Today vs. Yesterday.
- **1W:** Rolling 7-day window.
- **1M:** Rolling 30-day window.
- **Custom:** Date range picker (e.g., specific holiday weekends).

### C. Data Logic

- **Query:** Aggregates `total_amount` from the `orders` table where `status = 'completed'`.
- **Comparison:** Calculates percentage change against the _previous equivalent timeframe_ (e.g., "This Week" vs. "Last Week").

---

## 3. Feature II: AI Productivity Insight (Phone Time Saved)

_The "Proof of Value" card. Demonstrates ROI by quantifying labor savings._

### A. Visual Design

- **Location:** Directly under the Time Filter controls.
- **Container:** Sleek, rounded rectangle. Distinct background color (soft blue/purple) to differentiate "AI/Tech" data from "Financial" data.
- **Content:** Pure text-focused insight.
  > ✨ **AI Productivity Report**
  > TextToOrder saved your staff **2.5 hours** of phone time today.

### B. Business Logic

- **Formula:** `Total Text Orders` (in selected timeframe) × `3.5 minutes` (Average manual phone call duration).
- **Dynamic Text:**
  - If **1H/24H** selected: "Saved **X hours** today."
  - If **1W/1M** selected: "Saved **X hours** this month."

---

## 4. Feature III: Menu Intelligence (Top Movers)

_The inventory optimizer. Shows what is selling right now._

### A. Visual Design

- **Location:** Below the AI Insight card.
- **Header:** Simple title: "Top Movers" or "Trending Menu."
- **Layout:** Numbered list (Rank 1–5).
- **Row Style:** Minimalist.
  - `1. 🔥 Spicy Chicken Sandwich (42)`
  - `2. Seasoned Fries (35)`
  - `3. Mango Lassi (18)`

### B. Business Logic

- **Sync:** Updates instantly based on the Time Filter selected in Feature I.
- **"Fire" Logic (🔥):**
  - The system automatically appends a flame emoji if the item's sales velocity is >20% higher than its average for this time of day.

---

## 5. Technical Requirements

### Tech Stack

- **Frontend:** Next.js (React) + Tailwind CSS (for the minimal styling).
- **Charts:** shadcdn, Recharts or Visx (for the scrubbing interaction).
- **Backend:** we have this all created already and running in a cloud run server. for now, lets keep it all fake data and will add backend impls later
