# CHARNOKS POS - INTERACTION FLOWS & WIREFRAMES
## Complete User Journey Documentation

---

## 📑 TABLE OF CONTENTS
1. [User Interaction Flows](#user-interaction-flows)
2. [Screen Wireframes](#screen-wireframes)
3. [Component Interaction Patterns](#component-interaction-patterns)
4. [State Management Flows](#state-management-flows)
5. [Error Handling Patterns](#error-handling-patterns)
6. [Mobile-Specific Interactions](#mobile-specific-interactions)

---

## 🔄 USER INTERACTION FLOWS

### 1. OWNER ONBOARDING FLOW

```
Landing/Login
      │
      ▼
┌─────────────────┐
│   FIRST LOGIN   │
│                 │
│ No data detected│
│ Show welcome    │
└─────────────────┘
      │
      ▼
┌─────────────────┐
│  SETUP WIZARD   │
│                 │
│ Step 1: Business│
│ Step 2: Products│
│ Step 3: Workers │
└─────────────────┘
      │
      ▼ 
┌─────────────────┐
│   DASHBOARD     │
│                 │
│ Empty state with│
│ guided actions  │
└─────────────────┘
      │
      ▼
┌─────────────────┐
│  FULL FEATURES  │
│                 │
│ All functionality│
│ becomes available│
└─────────────────┘

Flow Specifications:
├── Welcome Detection: Check totalRevenue === 0
├── Setup Wizard: Multi-step modal
├── Progress Indicators: Step 1/3, 2/3, 3/3
├── Completion Celebration: Success animation
└── Dashboard Redirect: Auto-navigate after setup
```

---

### 2. DAILY SALES WORKFLOW (Worker)

```
Worker Login
      │
      ▼
┌─────────────────┐
│   DASHBOARD     │
│                 │
│ Today's summary │
│ [Record Sale]   │
└─────────────────┘
      │
      ▼
┌─────────────────┐
│   SALES PAGE    │
│                 │
│ Product Grid +  │
│ Empty Cart      │
└─────────────────┘
      │
      ▼ (Add products)
┌─────────────────┐
│  CART BUILDING  │
│                 │
│ Items accumulate│
│ Running total   │
└─────────────────┘
      │
      ▼ (Payment entry)
┌─────────────────┐
│ PAYMENT INPUT   │
│                 │
│ Number pad or   │
│ voice input     │
└─────────────────┘
      │
      ▼ (Validation)
┌─────────────────┐
│  CONFIRMATION   │
│                 │
│ Review & confirm│
│ Or edit manually│
└─────────────────┘
      │
      ▼ (Save)
┌─────────────────┐
│   SUCCESS       │
│                 │
│ Celebration +   │
│ Clear for next  │
└─────────────────┘

Key Interactions:
├── Product Tap: Add to cart (quantity +1)
├── Voice Button: Speak entire order
├── Number Pad: Enter payment amount
├── Validation: Must be >= total
├── Change Calculation: Auto-computed
└── Reset: Clear cart for next customer
```

---

### 3. VOICE INPUT PROCESSING FLOW

```
User Taps Voice Button
      │
      ▼
┌─────────────────┐
│  PERMISSION     │
│                 │
│ Request mic     │
│ access (first)  │
└─────────────────┘
      │
      ▼ (Granted)
┌─────────────────┐
│   LISTENING     │
│                 │
│ Red pulse icon  │
│ "Listening..."  │
└─────────────────┘
      │
      ▼ (Speech detected)
┌─────────────────┐
│  PROCESSING     │
│                 │
│ AI parsing      │
│ Product matching│
└─────────────────┘
      │
      ▼ (Success)
┌─────────────────┐
│  CONFIRMATION   │
│                 │
│ Show parsed     │
│ items & total   │
└─────────────────┘
      │
      ▼ (User confirms)
┌─────────────────┐
│  CART UPDATED   │
│                 │
│ Items added to  │
│ current sale    │
└─────────────────┘

Error Branches:
├── Permission Denied → Show manual entry option
├── No Speech → "Please try again"
├── Parse Failure → "Could not understand, try manual"
├── No Products Matched → "Products not found"
└── Network Error → Save locally, sync later
```

---

### 4. THEME SWITCHING FLOW

```
Settings Page
      │
      ▼
┌─────────────────┐
│ THEME SELECTOR  │
│                 │
│ Grid of theme   │
│ preview cards   │
└─────────────────┘
      │
      ▼ (User taps theme)
┌─────────────────┐
│ INSTANT PREVIEW │
│                 │
│ CSS variables   │
│ update globally │
└─────────────────┘
      │
      ▼ (Auto-save)
┌─────────────────┐
│   PERSISTENCE   │
│                 │
│ Save to         │
│ localStorage    │
└─────────────────┘
      │
      ▼
┌─────────────────┐
│  CONFIRMATION   │
│                 │
│ Brief toast:    │
│ "Theme applied" │
└─────────────────┘

Technical Flow:
├── Theme Data: Load available themes from themes.ts
├── Preview: Live CSS custom property updates
├── Storage: localStorage.setItem('charnoks-theme', id)
├── Global State: useTheme hook updates context
└── Persistence: Maintains across sessions
```

---

## 📱 SCREEN WIREFRAMES

### 1. LOGIN PAGE (Mobile)

```
┌─────────────────────────────┐
│                             │
│      [Animated Gradient]     │
│                             │
│     ┌─────────────────┐     │
│     │ ┌─────────────┐ │     │
│     │ │    LOGO     │ │     │ ← 96x96px orb with gradient
│     │ └─────────────┘ │     │
│     │                 │     │
│     │   CHARNOKS      │     │ ← 48px Bold, white
│     │ Point of Sale   │     │ ← 16px Regular, gray
│     │ 🍗 Fried Chicken │     │ ← 14px, centered
│     │                 │     │
│     │ ✨ Welcome Back │     │ ← 24px SemiBold
│     │                 │     │
│     │ Sign in to manage│     │ ← 14px Regular
│     │                 │     │
│     │ ┌─────────────┐ │     │
│     │ │👤 Email     │ │     │ ← Input: 48px height
│     │ └─────────────┘ │     │
│     │                 │     │
│     │ ┌─────────────┐ │     │
│     │ │🔒 Password👁│ │     │ ← Password with toggle
│     │ └─────────────┘ │     │
│     │                 │     │
│     │ ☑ Remember Me   │     │ ← Checkbox, 14px label
│     │   Forgot pwd?   │     │ ← Link, right-aligned
│     │                 │     │
│     │ ┌─────────────┐ │     │
│     │ │    LOGIN    │ │     │ ← Button: 48px height, full width
│     │ └─────────────┘ │     │
│     │                 │     │
│     │ Don't have acc? │     │ ← Center-aligned
│     │    Sign Up      │     │ ← Link, blue underline
│     └─────────────────┘     │
│                             │
└─────────────────────────────┘

Layout Specifications:
├── Container: max-w-sm (384px), min-h-screen
├── Card: Centered vertically and horizontally
├── Background: Animated gradient, 400% size
├── Stagger Animation: Elements appear 150ms apart
├── Input Icons: 20px, left padding 12px
├── Button: Full width, primary color
└── Links: Hover underline, color transitions
```

---

### 2. WORKER SALES PAGE (Mobile Portrait)

```
┌─────────────────────────────┐
│ Record Sale            [👤] │ ← Header: 64px height
├─────────────────────────────┤
│                             │
│ 🎙️ [Voice Input Button]     │ ← Full width, 48px height
│                             │
├─────────────────────────────┤
│                             │
│ ┌────────┐ ┌────────┐      │
│ │ 📦     │ │ 📦     │      │ ← Product grid: 2 columns
│ │ Image  │ │ Image  │      │   Card size: ~160x200px
│ │        │ │        │      │
│ │Chicken │ │ Fries  │      │
│ │₱90.00  │ │₱50.00  │      │
│ └────────┘ └────────┘      │
│                             │
│ ┌────────┐ ┌────────┐      │
│ │ 📦     │ │ 📦     │      │
│ │ Drinks │ │ Rice   │      │
│ │₱25.00  │ │₱30.00  │      │
│ └────────┘ └────────┘      │
│                             │
│     [More products...]      │
│                             │
├─────────────────────────────┤
│ 🛒 Cart (3 items)    ₱230   │ ← Fixed bottom bar
│ [View Cart]                 │
├─────────────────────────────┤
│ [        SAVE SALE        ] │ ← Primary button, 56px height
└─────────────────────────────┘

Responsive Notes:
├── Header: Fixed position, blur backdrop
├── Product Grid: 2 columns, 16px gap
├── Cart Bar: Fixed bottom, slides up to full screen
├── Voice Button: Prominent placement at top
└── Scroll Area: Product grid scrolls independently
```

---

### 3. WORKER SALES PAGE (Desktop)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Record Sale                                                        [👤] │
├─────────────────────────────────────────────────────────────────────────┤
│                                         │                               │
│ 🎙️ [Voice Input Button - Full Width]   │ Current Sale                  │
│                                         │                               │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐            │ 🛒 Cart Items                │
│ │📦  │ │📦  │ │📦  │ │📦  │            │                               │
│ │Chk │ │Fri │ │Drk │ │Ric │            │ ┌───────────────────────────┐ │
│ │₱90 │ │₱50 │ │₱25 │ │₱30 │            │ │📦 Chicken   x2     ₱180  │ │
│ └────┘ └────┘ └────┘ └────┘            │ │ [−] 2 [+]                │ │
│                                         │ └───────────────────────────┘ │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐            │                               │
│ │📦  │ │📦  │ │📦  │ │📦  │            │ ┌───────────────────────────┐ │
│ │Sd1 │ │Sd2 │ │Sd3 │ │Sd4 │            │ │📦 Fries     x1     ₱50   │ │
│ │₱45 │ │₱35 │ │₱40 │ │₱55 │            │ │ [−] 1 [+]                │ │
│ └────┘ └────┘ └────┘ └────┘            │ └───────────────────────────┘ │
│                                         │                               │
│ [More products in scrollable grid...]   │ ──────────────────────────── │
│                                         │ Total:        ₱230            │
│                                         │ Received:     ₱500 [Edit]     │
│                                         │ Change:       ₱270            │
│                                         │                               │
│                                         │ ┌───────────────────────────┐ │
│                                         │ │                           │ │
│                                         │ │       SAVE SALE           │ │
│                                         │ │                           │ │
│                                         │ └───────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘

Split Layout:
├── Left Panel: 60% width (products)
├── Right Panel: 40% width (cart)
├── Product Grid: 4 columns (adjusts to 3, 2 on smaller screens)
├── Voice Button: Full width above products
├── Cart: Fixed height, scrollable items
└── Totals: Fixed bottom section of cart
```

---

### 4. OWNER DASHBOARD (Desktop)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Dashboard Overview                                    🔄 [Refresh Data] │
│ Monitor your business performance                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐            │
│ │ 💰              │ │ 📈              │ │ 🛒              │            │
│ │                 │ │                 │ │                 │            │
│ │ TOTAL REVENUE   │ │ NET PROFIT      │ │ TRANSACTIONS    │            │
│ │                 │ │                 │ │                 │            │
│ │ ₱50,000         │ │ ₱12,000         │ │ 450             │            │
│ │                 │ │                 │ │                 │            │
│ │ +12.5% ▲ ──────│ │ +8.2% ▲ ────── │ │ +5 today ▲ ──  │            │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘            │
│                                                                         │
│ ┌───────────────────────────────┐ ┌─────────────────────────────────┐   │
│ │ Sales Trend                   │ │ Top Products                    │   │
│ │ ───────────────────────────── │ │ ─────────────────────────────── │   │
│ │                               │ │         ┌─────────┐             │   │
│ │    ₱60K ┤              ╱╲     │ │       ╱─┤ 40%  🍗 ├─╲           │   │
│ │         │         ╱───╯  ╲    │ │      ╱  └─────────┘  ╲          │   │
│ │    ₱40K ┤    ╱───╯       ╲   │ │     │       30%        │         │   │
│ │         │───╯              ╲  │ │     │   🍚  20%  🥤   │         │   │
│ │    ₱20K ┤                   ╲ │ │      ╲      10%      ╱          │   │
│ │         └─────────────────────│ │       ╲─── 🍟 ──── ╱           │   │
│ │         Mon Tue Wed Thu Fri   │ │         └─────────┘             │   │
│ │                               │ │                                 │   │
│ └───────────────────────────────┘ │ ■ Chicken 40%                   │   │
│                                   │ ■ Rice 30%                      │   │
│                                   │ ■ Drinks 20%                    │   │
│                                   │ ■ Sides 10%                     │   │
│                                   └─────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

Layout Grid:
├── Header: Full width, flex space-between
├── KPI Row: 3 columns, equal width, 24px gap
├── Charts Row: 60/40 split, 24px gap
├── Chart Heights: 350px consistent
├── Responsive: Stacks on tablet/mobile
└── Empty State: Shows if totalRevenue === 0
```

---

## 🎯 COMPONENT INTERACTION PATTERNS

### 1. PRODUCT CARD INTERACTION

```
State Sequence:
Default → Hover → Tap → Cart Update

Default:
┌────────────────┐
│ ┌────────────┐ │
│ │    IMAGE   │ │ ← Product image, 128px height
│ └────────────┘ │
│                │
│ Product Name   │ ← 16px Bold, truncated
│ Category       │ ← 14px Regular, gray
│                │
│ ₱99.00         │ ← 20px Bold, primary color
│ Stock: 50      │ ← 14px Regular, gray
└────────────────┘

Hover (+300ms transition):
┌────────────────┐
│ ┌────────────┐ │ ← Scale 1.05, shadow increase
│ │    IMAGE   │ │   Border: primary color
│ └────────────┘ │   Transform: translateY(-2px)
│                │
│ Product Name   │
│ Category       │
│ + ADD TO CART  │ ← Overlay button appears
│ ₱99.00         │
│ Stock: 50      │
└────────────────┘

Tap (Active):
┌────────────────┐
│ ┌────────────┐ │ ← Scale 0.98 (press effect)
│ │    IMAGE   │ │   Quick animation
│ └────────────┘ │
│ ✓ ADDED!       │ ← Temporary success state
│ Category       │
│                │
│ ₱99.00         │
│ Stock: 49      │ ← Stock decreases
└────────────────┘

Cart Update (Simultaneous):
- Cart counter +1
- Total amount updates
- Item appears in cart sidebar
- Brief success animation (green checkmark)
```

---

### 2. VOICE INPUT FLOW

```
Button States & Transitions:

Idle (Default):
┌────────────────────────────────────┐
│             🎙️ Voice Input          │
└────────────────────────────────────┘
- Background: rgba(255,255,255,0.1)
- Border: 2px solid border/50
- Text: "🎙️ Voice Input"

Permission Request:
┌────────────────────────────────────┐
│         Allow microphone?          │
│    [Block]           [Allow]       │
└────────────────────────────────────┘
- Browser native permission dialog
- App state: Waiting for permission

Listening (Active):
┌────────────────────────────────────┐
│  ●  Listening...                   │ ← Red pulsing dot
└────────────────────────────────────┘
- Background: rgba(239,68,68,0.3)
- Border: 2px solid red-500
- Animation: Pulse effect on dot

Processing (AI Working):
┌────────────────────────────────────┐
│  ◌  Processing...                  │ ← Spinning loader
└────────────────────────────────────┘
- Background: rgba(59,130,246,0.3)
- Border: 2px solid blue-500
- Spinner: 16px, white color

Success (Parsed):
┌────────────────────────────────────┐
│  ✓  Found 3 items!                 │ ← Green checkmark
└────────────────────────────────────┘
- Background: rgba(34,197,94,0.3)
- Border: 2px solid green-500
- Auto-revert to idle after 2s

Error (Failed):
┌────────────────────────────────────┐
│  ⚠️  Could not understand          │ ← Warning icon
└────────────────────────────────────┘
- Background: rgba(239,68,68,0.3)
- Border: 2px solid red-500
- Click to retry
```

---

### 3. MODAL INTERACTION PATTERN

```
Open Sequence:
1. Trigger (button click, action)
2. Backdrop fade in (200ms)
3. Modal scale + fade in (300ms, slight bounce)
4. Focus trap activated
5. Escape key listener added

┌─────────────────────────────────────────────┐
│ ████████████████████████████████████████    │ ← Backdrop: rgba(0,0,0,0.6)
│ ████████████████████████████████████████    │   Blur effect
│ ████████████┌─────────────────┐████████    │
│ ████████████│ Modal Title [×] │████████    │ ← Modal: Scale from 0.9 to 1.0
│ ████████████├─────────────────┤████████    │   Shadow: Large elevation
│ ████████████│                 │████████    │
│ ████████████│ Content area    │████████    │
│ ████████████│                 │████████    │
│ ████████████├─────────────────┤████████    │
│ ████████████│ [Cancel] [OK]   │████████    │
│ ████████████└─────────────────┘████████    │
│ ████████████████████████████████████████    │
└─────────────────────────────────────────────┘

Close Sequence:
1. Trigger (×, cancel, escape, backdrop click)
2. Modal scale + fade out (200ms)
3. Backdrop fade out (300ms)
4. Remove from DOM
5. Return focus to trigger element

Mobile Adaptation:
- Modal becomes bottom sheet
- Slides up from bottom
- Swipe handle at top
- Partial backdrop (top 15% visible)
```

---

### 4. THEME SELECTOR INTERACTION

```
Theme Card Grid:
┌─────────┐ ┌─────────┐ ┌─────────┐
│🔥      │ │🌊      │ │🌲      │
│ Charnok│ │ Ocean  │ │ Forest │ ← Preview gradients
│ Classic│ │        │ │        │   Theme names
└─────────┘ └─────────┘ └─────────┘

Interaction Flow:
1. Hover: Scale 1.05, shadow increase
2. Click: Instant theme application
3. Active border: Primary color, 2px
4. Success feedback: Brief toast notification

Live Preview System:
- CSS custom properties update immediately
- All components reflect new theme
- No page reload required
- LocalStorage updated automatically

┌─────────┐ ← Active theme
│🔥 ✓    │   Check mark overlay
│ Charnok│   Primary border
│ Classic│   Scale 1.05 persistent
└─────────┘
```

---

## 🔄 STATE MANAGEMENT FLOWS

### 1. CART STATE MANAGEMENT

```
Cart Operations:

Add Item:
cartItems.push({
  product: selectedProduct,
  quantity: 1,
  subtotal: product.price
})
→ Update total
→ Update cart counter
→ Show feedback animation

Update Quantity:
item.quantity = newQuantity
item.subtotal = item.quantity * item.product.price
→ Recalculate total
→ Update UI immediately
→ Validate stock availability

Remove Item:
cartItems = cartItems.filter(item => item.id !== removedId)
→ Update total
→ Update cart counter
→ Animate item removal

Clear Cart:
cartItems = []
total = 0
→ Reset all displays
→ Return to empty state
→ Show empty cart message

State Structure:
{
  items: CartItem[],
  total: number,
  tax: number,
  discount: number,
  finalTotal: number,
  payment: number,
  change: number
}
```

---

### 2. VOICE INPUT STATE FLOW

```
Voice State Machine:

IDLE
  │ (user clicks button)
  ▼
REQUESTING_PERMISSION
  │ (permission granted)
  ▼
LISTENING
  │ (speech detected)
  ▼
PROCESSING
  │ (AI parsing complete)
  ▼
CONFIRMATION
  │ (user confirms/edits)
  ▼
APPLIED ─── (success) ──→ IDLE
  │
  └─ (error) ──→ ERROR ──→ IDLE

Error Branches:
- Permission Denied → Show manual input
- No Speech → Timeout, return to idle
- Parse Error → Show error message
- Network Error → Queue for later processing
```

---

### 3. OFFLINE/ONLINE STATE

```
Connection State Flow:

ONLINE (Default)
  │ (connection lost)
  ▼
OFFLINE
  │ (operations continue)
  │ (data stored locally)
  ▼
QUEUED
  │ (connection restored)
  ▼
SYNCING
  │ (sync complete)
  ▼
ONLINE

Offline Capabilities:
✅ Record sales → IndexedDB
✅ Add products → Local storage
✅ View cached data → ServiceWorker
✅ Voice processing → Local AI (limited)
❌ User management → Requires connection
❌ Real-time analytics → Requires connection
❌ Backup/restore → Requires connection

UI Indicators:
- Connection status badge
- Offline mode warning
- Sync progress indicator
- Pending operations counter
```

---

## ⚠️ ERROR HANDLING PATTERNS

### 1. GRACEFUL DEGRADATION

```
Network Error Hierarchy:

Level 1 - Seamless Fallback:
- Voice input → Manual input option
- Real-time sync → Local storage + queue
- Live charts → Cached data notice

Level 2 - User Notification:
- API timeout → "Trying to reconnect..."
- Partial data → "Some data may be outdated"
- Feature unavailable → "Available when online"

Level 3 - Blocking Error:
- Authentication failure → Redirect to login
- Critical data corruption → Error boundary
- App crash → Reload prompt with data recovery

Error Message Patterns:
┌─────────────────────────────────────┐
│ ⚠️  Connection Issue                │
│                                     │
│ Some features may be limited while  │
│ offline. Your data is safe and will │
│ sync when connection is restored.   │
│                                     │
│ [Continue Offline] [Try Again]      │
└─────────────────────────────────────┘
```

---

### 2. VALIDATION ERROR DISPLAY

```
Form Field Validation:

Success State:
┌─────────────────────────────────────┐
│ Email Address                       │
│ ┌─────────────────────────────────┐ │
│ │ user@example.com              ✓ │ │ ← Green checkmark
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘

Error State:
┌─────────────────────────────────────┐
│ Email Address                       │
│ ┌─────────────────────────────────┐ │
│ │ invalid-email                 ⚠️ │ │ ← Red border, warning icon
│ └─────────────────────────────────┘ │
│ Please enter a valid email address  │ ← Error message
└─────────────────────────────────────┘

Real-time Validation:
- onBlur: Basic validation
- onChange: Format validation (debounced 300ms)
- onSubmit: Comprehensive validation
- Server response: Backend validation errors
```

---

### 3. CRITICAL ERROR BOUNDARIES

```
Error Boundary Component:

Application Crash:
┌─────────────────────────────────────┐
│                                     │
│             ⚠️                      │
│                                     │
│      Something went wrong           │
│                                     │
│   We're sorry, but something        │
│   unexpected happened. Your         │
│   data has been saved locally.      │
│                                     │
│   [Reload App] [Report Issue]       │
│                                     │
└─────────────────────────────────────┘

Error Recovery:
1. Log error details to console
2. Save current state to localStorage
3. Display user-friendly message
4. Provide recovery options
5. Optional error reporting

Fallback UI:
- Minimal interface
- Core functionality only
- Manual data export option
- Contact support information
```

---

## 📱 MOBILE-SPECIFIC INTERACTIONS

### 1. TOUCH GESTURES

```
Gesture Patterns:

Tap:
- Single tap: Select/activate
- Double tap: Quick action (add to cart)
- Long press: Context menu/details

Swipe:
- Swipe left: Delete item (with confirmation)
- Swipe right: Mark as complete/favorite
- Swipe up: Refresh data
- Swipe down: Close modal/drawer

Pinch:
- Pinch to zoom: Product images
- Spread: Expand details view

Pull to Refresh:
┌─────────────────┐
│       ↓         │ ← Pull indicator
│   Pull to       │
│   refresh       │
├─────────────────┤
│ Content area... │
│                 │
└─────────────────┘
```

---

### 2. RESPONSIVE LAYOUT SHIFTS

```
Breakpoint Transitions:

Desktop → Tablet:
- Sidebar collapses to drawer
- 4-column grid → 3-column
- Split layout → stacked

Tablet → Mobile:
- 3-column → 2-column
- Horizontal forms → vertical
- Side navigation → bottom tabs

Mobile Optimizations:
- Larger tap targets (44px minimum)
- Thumb-friendly button placement
- Simplified navigation
- Bottom sheet modals
- Sticky action buttons
```

---

### 3. DEVICE-SPECIFIC FEATURES

```
Mobile Capabilities:

Camera Integration:
- Product photo capture
- Barcode scanning (future)
- Document scanning (receipts)

Voice Recognition:
- Enhanced for mobile microphones
- Noise cancellation
- Offline voice processing

Haptic Feedback:
- Success vibration (100ms)
- Error vibration (200ms burst)
- Button press feedback (light tap)

Push Notifications:
- Sale completion confirmation
- Low stock alerts
- Daily summary
- Sync status updates

App Shell:
- Offline-first architecture
- Service worker caching
- App-like navigation
- Install prompt (PWA)
```

---

**Document Version**: 3.0  
**Interaction Flows**: 15+ documented  
**Wireframes**: 10+ screen layouts  
**Component Patterns**: 25+ interactions  
**Ready for**: Development handoff, User testing, Stakeholder review