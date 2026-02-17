# AI Data Chatbot - Testing Guide

## New Design Features

### 1. **Minimalist Collapsed State**
- Initially appears as a sleek input box
- Width matches the chart above
- Clean rounded corners (rounded-xl)
- Placeholder: "Ask me anything about Burger Palace"
- No emojis, no headers, no clutter

### 2. **Smooth Expansion Animation**
- On first message send, expands with smooth 500ms animation
- Reveals chat history area (440px height)
- Shadow increases subtly on expansion
- Input stays at bottom with border separator

### 3. **Clean Design Elements**
- **User messages**: Dark background (gray-900/white in dark mode)
- **AI responses**: Light background (gray-100/gray-800 in dark mode)
- **Typing indicator**: Minimalist bouncing dots
- **Send button**: Small black/white circle with arrow icon
- **No timestamps shown** (removed for cleaner look)
- **No emojis** (completely removed)

## Testing Steps

1. **Visit http://localhost:3000**
2. **Scroll down** below the chart to see the chatbot
3. **Initial state**: Should see just a clean input box
4. **Type a message**: e.g., "What were my sales for burgers?"
5. **Press Enter**: Watch the smooth expansion animation
6. **Observe**: Chat interface reveals with your message and AI response
7. **Continue chatting**: Ask more questions like:
   - "How much cheese should I stock for Tuesday's sale?"
   - "What are my peak hours?"
   - "Show me trending items"

## Test Queries

### Sales Queries
- "What were my sales for fatty patties in the past 3 days?"
- "Show me burger sales"

### Inventory Queries
- "How much cheese should I stock up on for Tuesday's discounted sale?"
- "What inventory should I prepare for the weekend?"

### Trends
- "What items are trending?"
- "Which products are growing or declining?"

### Revenue
- "Show me revenue trends"
- "What's my average order value?"

### Peak Hours
- "When are my busiest times?"
- "What are my peak hours?"

## UI Details

### Collapsed State (Initial)
```
┌─────────────────────────────────────────────────────┐
│  Ask me anything about Burger Palace             ➤ │
└─────────────────────────────────────────────────────┘
```

### Expanded State (After First Message)
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                        User: What were my sales?  │
│                                                     │
│  AI: Your top performers are the Classic...        │
│                                                     │
│  • • •  (when typing)                              │
│                                                     │
├─────────────────────────────────────────────────────┤
│  Ask me anything about Burger Palace             ➤ │
└─────────────────────────────────────────────────────┘
```

## Responsive Behavior

- **Focus**: Input gets a subtle ring (ring-2)
- **Disabled state**: Grays out when AI is typing
- **Auto-scroll**: Automatically scrolls to latest message
- **Smooth transitions**: All state changes are animated (500ms)
- **Dark mode**: Fully compatible with color inversions

## Browser Compatibility

Works in all modern browsers:
- Chrome/Edge
- Firefox
- Safari
- Mobile browsers (responsive design)
