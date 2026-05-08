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

Okay next feature is going to be the marketing endpoints. you can put these endpoints in a new python file called marketing.py just like how we have anlytics.py.

So as you can see in the select items tab when we are creating a campaign, there is a list of items. I want you to firstly make a call to the items endpoint, make sure it is backend paged, and it should show 5 items at a time. Under the items there should be a litte <> arrow switcher as the icons. There should also be a search bar at the top to search for an item. When they select the item, make sure in the request body, its the clover id, and clover name

After the user selects an item, the user will input a description of the campaign they want to send

Then, they can either set a discount, or no discount.

Then, they can set whether the campaign should be targeted or not targeted.

Then, they review their input, and press Launch campaign (Lets change this to "Configure campaign"). Pressing this hits 2 endpoints:

1. an endpoint that returns the number of customers you will be messaging with this campaign

- if the user selected non targetted users, then it will return the list of ids of all the customers that are in the customer_restaurant_consents table with that restuant and are opted_in status
- if the user selected targetted, then we need to run a LLM call with gemini 3 pro (put the prompt for this in a txt file in the project, not inline, so that its easy to edit and read)
  - input:
    - an object that consists of the ids of any customer that has messaged the restaurnt (ie opted in status is opted_in in the customer_restaurant_consents table) and that customers user_preferences json thats in customers table.
    - an object that tells the LLM what the item is, (the name, the ingredients that were given to us from when the user was configuring the campaign.)
    - also the input from the campaign description
  - output: a list of all the ids of the customers that the LLM thinks would enjoy this item (i.e. their preferences align with the item itself). we return this back to the user

2. an endpoint that creates the message we will be sending out with the option to edit if the user wants to

- this will be another LLM call (put it as a txt file as well) that takes in:
  - Take the camapign description, the item, the item description if available, the discount if set, and pass it to the LLM. the output of the LLM should be the message that we will be sending to the customers

The flow should be, the user hits configure campaign, it takes them to the next screen where the two outputs of the endpoits i mentioned are loading, and there is a button that says Launch campaign that is also in loading state while the endpoints are returning back. once it gets back to us, we populate the fields, if the user wants to edit the message, they can, if they want to switch from targetted marketing to untargetted, or back and forth, they can (we can make sure to keep this value in the users local cache so we dont keep hitting the backend for this data every time they switch).

Then, the user will be be allowed to press Launch campaign. This will then hit another endpoint:

- input: Request body of the message to send out, the list of customer ids
- logic: creates a row in the campaigns table (we also need to create this table in the database) and starts sending out messages. Make sure each message you send out is spaced out by 3 second. We do not wnat to rate limit twilio/telnyx. We need to archetectect the best most scalable way to do this. (pub sub? dataflow? supabase function?idk)
- output: the user is redirected back to the main marketing page, and can see their camapaign there. As it is sending out messages, we should be able to see a status dot like a green dot as it is sending out messages. once its done, that should become a checkmark.

This should then send a request to the backend to launch the campaign and start processing and sending out messages to the users.
