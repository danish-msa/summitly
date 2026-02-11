# 🎯 Where to Find AI Analysis Feature

## Property Cards - AI Analysis Button

Every property card now has an **AI Analysis** button that opens an AI-powered valuation dialog.

### Visual Location

```
┌─────────────────────────────────────┐
│  Property Image                      │
│  [Property Type Badge]        [♡]   │  
│                                      │
└─────────────────────────────────────┘
│  $1,250,000          2 days ago     │
│  📍 123 Main St, Toronto            │
│  🛏️ 3  🛁 2  📐 2000 sqft          │
├─────────────────────────────────────┤
│  [✨ AI Analysis]  [View Details]   │  ← NEW!
└─────────────────────────────────────┘
```

### Button Details
- **Icon**: ✨ Sparkles (represents AI magic)
- **Text**: "AI Analysis"
- **Style**: Outline button (secondary style)
- **Position**: Left side, next to "View Details"

## AI Analysis Dialog

When clicked, opens a full-screen modal with:

### Dialog Structure
```
╔═════════════════════════════════════════════════════════╗
║  ✨ AI Property Analysis                                ║
║  AI-powered valuation and insights for 123 Main St     ║
╠═════════════════════════════════════════════════════════╣
║                                                         ║
║  ┌───────────────────────────────────────────────┐    ║
║  │ Property Summary                              │    ║
║  │ 123 Main St                   $1,250,000      │    ║
║  │ Toronto, ON                   [Detached]      │    ║
║  │ 🏠 3 Bed  🏠 2 Bath  🏠 2000 sqft            │    ║
║  └───────────────────────────────────────────────┘    ║
║                                                         ║
║  ┌───────────────────────────────────────────────┐    ║
║  │ 💰 AI Valuation                               │    ║
║  │ Estimated Value      $1,275,000               │    ║
║  │ Value Range          $1,225,000 - $1,325,000  │    ║
║  │ Confidence           87%                      │    ║
║  └───────────────────────────────────────────────┘    ║
║                                                         ║
║  ┌───────────────────────────────────────────────┐    ║
║  │ 📈 Investment Insights                        │    ║
║  │ • Strong appreciation potential in area       │    ║
║  │ • Below average price per sqft                │    ║
║  │ • Excellent school district                   │    ║
║  └───────────────────────────────────────────────┘    ║
║                                                         ║
║  ┌───────────────────────────────────────────────┐    ║
║  │ 📅 Market Analysis                            │    ║
║  │ The Toronto market is experiencing steady     │    ║
║  │ growth with average prices rising 3.2%...     │    ║
║  └───────────────────────────────────────────────┘    ║
║                                                         ║
║  ┌───────────────────────────────────────────────┐    ║
║  │ Comparable Properties                          │    ║
║  │ 456 Oak Ave        $1,230,000   0.3 km away   │    ║
║  │ 789 Pine St        $1,290,000   0.5 km away   │    ║
║  └───────────────────────────────────────────────┘    ║
║                                                         ║
╠═════════════════════════════════════════════════════════╣
║                      [Close] [Chat with AI About This]  ║
╚═════════════════════════════════════════════════════════╝
```

## Where It Appears

### ✅ Currently Active On:
1. **Buy Page**: `/buy/toronto` (and all cities)
2. **Rent Page**: `/rent/toronto` (and all cities)
3. **Property Grids**: Any page using `PropertyCard` component
4. **Search Results**: Property listing pages

### 🎯 Test It Now:
1. Navigate to: http://localhost:3000/buy/toronto
2. Scroll to any property card
3. Look for the "✨ AI Analysis" button (left button)
4. Click it to see the AI-powered analysis

## Icons Used

### Sparkles Icon (✨)
- **Location**: AI Analysis button on property cards
- **Meaning**: Represents AI-powered features
- **Color**: Inherits from button style
- **Size**: 16px (h-4 w-4)

### Dialog Section Icons
- 💰 **Dollar Sign**: Valuation section
- 📈 **Trending Up**: Investment insights
- 📅 **Calendar**: Market analysis
- 🏠 **Home**: Property specs
- 📍 **Map Pin**: Location
- ⚡ **Loader**: Loading state

## User Journey

```
Property Card
    ↓
[Click AI Analysis]
    ↓
Dialog Opens (Property Summary)
    ↓
Loading Spinner (2-5 seconds)
    ↓
AI Analysis Results
    ↓
[Options]
    → Close (return to grid)
    → Chat with AI (open /ai page with context)
```

## Technical Flow

```
Property Card Button Click
    ↓
State: setShowAIAnalysis(true)
    ↓
Dialog Opens
    ↓
useEffect triggers fetchAnalysis()
    ↓
API Call: /api/ai/analysis
    ↓
Backend: http://127.0.0.1:5050/api/property-analysis
    ↓
AI Processing (OpenAI + Repliers)
    ↓
Response with valuation data
    ↓
Dialog displays results
```

## Styling

### Button Styles
```tsx
// Primary action button style
variant="outline"    // White background, border
size="sm"            // Compact size
className="flex-1"   // Equal width with "View Details"
```

### Dialog Styles
- Max width: 3xl (768px)
- Max height: 85vh (scrollable)
- Rounded corners: lg
- Border: subtle gray
- Background: Card background with muted sections

## Responsive Behavior

### Desktop (1024px+)
- Dialog: 768px wide, centered
- Button: Full text visible
- All sections expanded

### Tablet (768px - 1023px)
- Dialog: 90% viewport width
- Button: Full text visible
- Sections maintain layout

### Mobile (< 768px)
- Dialog: Full width with padding
- Button: Icon + text stack on very small screens
- Scrollable sections

## Keyboard Shortcuts

- **Esc**: Close dialog
- **Tab**: Navigate between buttons
- **Enter**: Activate focused button
- **Space**: Activate focused button

---

**Quick Test Command**: Navigate to http://localhost:3000/buy/toronto and look for the ✨ button!
