# Revenue Dashboard Components

## Design Philosophy

**Aesthetic**: High-Contrast Financial Terminal - inspired by Bloomberg Terminal and Robinhood, designed for mobile-first restaurant owners who need instant validation that their AI ordering system is working.

### Key Design Decisions

#### 1. Typography
- **Outfit (Bold/Black)**: Used for the hero revenue number - geometric, powerful, and commands attention
- **DM Sans**: Clean, refined sans-serif for UI elements - readable but distinctive
- **JetBrains Mono**: Monospace for data points and technical information - evokes financial terminals

#### 2. Color Strategy
- **Deep Navy-Black Base** (#0A0E1A - #1A1F2E): Creates focus and reduces eye strain for frequent checking
- **Electric Green** (#10B981): Growth indicator with subtle glow effect for positive psychology
- **Vibrant Red** (#EF4444): Decline indicator - clear but not alarming
- **Warm Orange** (#F59E0B): Neutral state for small changes
- **Cyan Accents** (#06B6D4): Interactive elements and highlights

#### 3. Animation & Interaction
- **Number Counter**: Revenue animates up on load for satisfying "slot machine" effect
- **Scrubbing**: Smooth chart interaction with tooltip that pops in
- **Filter Transitions**: Staggered slide-in animation for pills
- **Glow Effects**: Subtle pulsing on positive delta creates "winning" feeling
- **Active States**: Neon underline on active filter with backdrop blur

#### 4. Mobile-First Design
- Touch targets: Minimum 44px for easy tapping
- Horizontal scroll for filters on small screens
- Large, readable numbers (7xl-8xl text)
- Generous spacing throughout

## Components

### RevenueDashboard
Main container component that orchestrates the entire dashboard.

**Features:**
- Manages time filter state
- Generates sample data based on selected timeframe
- Calculates delta and comparison labels
- Dark theme with ambient gradient background
- Animated glow effects in background

**Sample Data:**
- 1H: 12 data points at 5-minute intervals
- 24H: 24 data points at 1-hour intervals
- 1W: 28 data points at 6-hour intervals
- 1M: 30 data points at 1-day intervals

### TimeFilter
Pill-style time range selector.

**Features:**
- 5 options: 1H, 24H, 1W, 1M, Custom (disabled)
- Active state: Cyan gradient background with neon underline
- Staggered entrance animation (50ms delay between pills)
- Hover states with scale transition
- Mobile-friendly horizontal scroll

**Interaction:**
- Click to switch timeframes
- Active filter has pulsing glow effect
- Disabled state for "Custom" (future feature)

### RevenueHero
The star of the show - giant revenue number with delta indicator.

**Features:**
- Massive revenue display (7xl-8xl size)
- Animated counter: Numbers "tick up" on mount (800ms duration, 30 steps)
- Gradient text effect (white → gray) for depth
- Delta badge with:
  - Color-coded background and border
  - Arrow indicator (↑/↓)
  - Percentage in monospace font
  - Glow effect on positive growth
- Comparison label (e.g., "vs. yesterday")

**Color Logic:**
- Green: Delta > 5%
- Red: Delta < -5%
- Orange: Delta between -5% and 5%

### RevenueChart
Interactive area chart with scrubbing functionality.

**Features:**
- Recharts-based sparkline
- Gradient fill under line (30% opacity at top, fading to 0)
- Color adapts to overall trend (green for growth, red for decline)
- Grid lines for readability
- X-axis: Time labels formatted per filter
- Y-axis: Currency in thousands ($8k format)

**Scrubbing Interaction:**
- Hover/drag over chart to see specific data points
- Tooltip shows:
  - Large revenue number in Outfit font
  - Timestamp in JetBrains Mono
  - Smooth pop-in animation
  - Cyan border with glow
- Cursor line with dashed cyan stroke
- Hint text: "Drag to explore data points" (fades when scrubbing)

**Animation:**
- Chart animates in over 800ms with ease-out easing
- Tooltip pops in with scale + translateY effect

## Usage

### Basic Implementation

```tsx
import { RevenueDashboard } from '@/components';

export default function DashboardPage() {
  return <RevenueDashboard />;
}
```

### With Custom Data (Future Enhancement)

```tsx
import { RevenueDashboard } from '@/components';
import type { RevenueDataPoint } from '@/components';

const myData: RevenueDataPoint[] = [
  { timestamp: new Date('2024-01-01T10:00:00'), revenue: 8500 },
  { timestamp: new Date('2024-01-01T11:00:00'), revenue: 9200 },
  // ... more data points
];

export default function DashboardPage() {
  return <RevenueDashboard data={myData} />;
}
```

## Performance Considerations

1. **Font Loading**: Fonts are loaded via Google Fonts with `display=swap` to prevent FOIT
2. **Chart Rendering**: Recharts uses SVG rendering, performant on mobile
3. **Animation**: CSS animations used where possible, JavaScript only for number counter
4. **Responsive Container**: Chart adapts to container width automatically

## Accessibility

- High contrast ratios (light text on dark background)
- Touch targets meet 44px minimum
- Keyboard navigation support (buttons focusable)
- Semantic HTML structure
- Alt text for visual indicators (arrows)

## Future Enhancements

1. **Custom Date Range**: Implement date picker for "Custom" filter
2. **Real-time Updates**: WebSocket integration for live data
3. **Annotations**: Mark special events on timeline (e.g., "Happy Hour")
4. **Export**: Download chart as image
5. **Comparison Mode**: Overlay previous period on chart
6. **Haptic Feedback**: Vibrate on scrubbing (mobile PWA)
7. **Dark/Light Toggle**: Though dark is optimal for this use case

## Technical Details

**Dependencies:**
- React 19
- Recharts 2.15+
- Tailwind CSS 3.4+
- TypeScript 5+

**Browser Support:**
- Modern browsers with CSS Grid, CSS Variables, and SVG support
- Tested on iOS Safari, Chrome Mobile, Desktop browsers
- Graceful degradation for older browsers (no animations)

## Design Tokens

```css
/* Colors */
--bg-primary: #0A0E1A;
--bg-secondary: #0F1420;
--bg-tertiary: #1A1F2E;
--text-primary: #FFFFFF;
--text-secondary: #9CA3AF;
--accent-green: #10B981;
--accent-red: #EF4444;
--accent-orange: #F59E0B;
--accent-cyan: #06B6D4;

/* Shadows */
--shadow-green: 0 0 20px rgba(16, 185, 129, 0.5);
--shadow-cyan: 0 0 20px rgba(6, 182, 212, 0.2);

/* Spacing */
--touch-target-min: 44px;
--border-radius-lg: 16px;
--border-radius-xl: 20px;
```
