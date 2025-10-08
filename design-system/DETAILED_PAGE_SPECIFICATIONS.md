# CHARNOKS POS - DETAILED PAGE SPECIFICATIONS
## Visual Design Documentation for All Pages

---

## 📄 TABLE OF CONTENTS
1. [Owner Pages](#owner-pages)
2. [Worker Pages](#worker-pages)
3. [Authentication Pages](#authentication-pages)
4. [Shared Components](#shared-components)
5. [Visual Flow Diagrams](#visual-flow-diagrams)

---

## 👔 OWNER PAGES

### 1. OWNER DASHBOARD (HomePage)

#### Visual Layout
```
┌─────────────────────────────────────────────────────────────────┐
│  SIDEBAR (256px)    │  MAIN CONTENT (flexible width)           │
│  ─────────────────  │  ───────────────────────────────────────  │
│  [Logo] CHARNOKS    │  Dashboard Overview                       │
│                     │  Monitor your business performance        │
│  📊 Dashboard       │                                           │
│  📈 Analysis        │  [🔄 Refresh]                            │
│  📦 Products        │                                           │
│  🧾 Expenses        │  ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  💰 Transactions    │  │  Total   │ │   Net    │ │  Total   │  │
│  📝 Notes           │  │ Revenue  │ │  Profit  │ │Transaction│ │
│  ⚙️ Settings        │  │          │ │          │ │          │  │
│                     │  │ ₱50,000  │ │ ₱12,000  │ │   450    │  │
│  ─────────────────  │  │ +12.5%▲  │ │ +8.2%▲   │ │ +5 today▲│  │
│  [Logout Button]    │  └──────────┘ └──────────┘ └──────────┘  │
│                     │                                           │
│                     │  ┌─────────────────────┐ ┌──────────────┐│
│                     │  │  Sales Trend        │ │ Top Products ││
│                     │  │  ───────────────    │ │ ────────────  ││
│                     │  │     [Area Chart]    │ │ [Pie Chart]  ││
│                     │  │                     │ │              ││
│                     │  │  Mon ────────────── │ │ Chicken 40%  ││
│                     │  │  Tue ────────────── │ │ Rice 30%     ││
│                     │  │  Wed ────────────── │ │ Drinks 20%   ││
│                     │  │  Thu ────────────── │ │ Sides 10%    ││
│                     │  └─────────────────────┘ └──────────────┘│
│                     │                                           │
│                     │  [Welcome Guide - Only if no data]        │
│                     │  🎉 Welcome to Your Dashboard!            │
│                     │  ┌────────┐ ┌────────┐ ┌────────┐       │
│                     │  │1. Add  │ │2.Record│ │3.Monitor│       │
│                     │  │Products│ │ Sales  │ │ Growth │       │
│                     │  └────────┘ └────────┘ └────────┘       │
└─────────────────────────────────────────────────────────────────┘

Dimensions:
├── Sidebar Width: 256px
├── Main Content Padding: 32px (desktop), 24px (tablet), 16px (mobile)
├── KPI Card Size: ~400px x 140px (flexible width)
├── Chart Height: 350px
└── Gap between sections: 24px
```

#### Visual Hierarchy
1. **Header Section**
   - H1: "Dashboard Overview" - 48px Bold, White
   - Subtitle: "Monitor..." - 16px Regular, Gray-200
   - Refresh button: Right-aligned, White/10 background

2. **KPI Cards Row**
   - 3 cards in grid (responsive: 3→2→1 columns)
   - Card background: Glassmorphism (backdrop-blur)
   - Hover effect: Border color change + shimmer
   - Trend indicators: Green (▲) or Red (▼)

3. **Charts Section**
   - 2 columns (60/40 split desktop, stacked mobile)
   - Area chart: Gradient fill from primary color
   - Pie chart: 5-color palette with labels

4. **Empty State (Conditional)**
   - Only shows when totalRevenue === 0
   - 3 step cards in grid
   - Each card: Blue-800/20 background, rounded corners

#### Color Usage
```css
Background: Linear gradient (DB4E2A → FCB93B)
Cards: rgba(120, 53, 15, 0.5) with backdrop-blur
Borders: rgba(245, 158, 11, 0.5)
Text Primary: #FFFFFF
Text Secondary: #E5E7EB
Primary Action: #DC2626
Success: #22C55E
```

---

### 2. PRODUCTS PAGE

#### Visual Layout
```
┌─────────────────────────────────────────────────────────────────┐
│  SIDEBAR    │  MAIN CONTENT                                     │
│  ─────────  │  ─────────────────────────────────────────────   │
│             │  Product Management                               │
│             │  Add new items to your inventory                  │
│             │                                                   │
│             │  ┌─────────────────────────────────────────────┐ │
│             │  │  PRODUCT FORM (Glass Card)                  │ │
│             │  │  ┌─────────────┐  ┌──────────────────────┐ │ │
│             │  │  │ LEFT COLUMN │  │  RIGHT COLUMN        │ │ │
│             │  │  │             │  │                      │ │ │
│             │  │  │ Product Name│  │  ┌────────────────┐ │ │ │
│             │  │  │ [________]  │  │  │                │ │ │ │
│             │  │  │             │  │  │   Image Upload │ │ │ │
│             │  │  │ Price  Qty  │  │  │   Drag & Drop  │ │ │ │
│             │  │  │ [___] [___] │  │  │                │ │ │ │
│             │  │  │             │  │  │   📸 Click or  │ │ │ │
│             │  │  │ Category    │  │  │   drag image   │ │ │ │
│             │  │  │ [________]  │  │  │                │ │ │ │
│             │  │  │             │  │  └────────────────┘ │ │ │
│             │  │  └─────────────┘  └──────────────────────┘ │ │
│             │  │                                             │ │
│             │  │  [Reset]           [Save Product ✓]        │ │
│             │  └─────────────────────────────────────────────┘ │
│             │                                                   │
│             │  ┌─────────────────────────────────────────────┐ │
│             │  │  Current Products (24)           [🔄 Refresh]│ │
│             │  │  ───────────────────────────────────────────│ │
│             │  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐          │ │
│             │  │  │ 📦  │ │ 📦  │ │ 📦  │ │ 📦  │          │ │
│             │  │  │Image│ │Image│ │Image│ │Image│          │ │
│             │  │  │     │ │     │ │     │ │     │          │ │
│             │  │  │Name │ │Name │ │Name │ │Name │          │ │
│             │  │  │Cat  │ │Cat  │ │Cat  │ │Cat  │          │ │
│             │  │  │₱99  │ │₱99  │ │₱99  │ │₱99  │          │ │
│             │  │  │St:10│ │St:10│ │St:10│ │St:10│          │ │
│             │  │  └─────┘ └─────┘ └─────┘ └─────┘          │ │
│             │  │  [Grid continues with 4 cols desktop...]    │ │
│             │  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

Grid Columns:
├── Desktop (>1280px): 4 columns
├── Tablet (768-1280px): 3 columns  
├── Mobile (640-768px): 2 columns
└── Small Mobile (<640px): 2 columns (tighter spacing)
```

#### Form Specifications
```
Product Form Card:
├── Layout: 2-column grid (desktop), 1-column (mobile)
├── Background: var(--card-bg) with 80% opacity
├── Border: 1px solid var(--border) with 50% opacity
├── Border Radius: 24px
├── Padding: 24px
└── Shadow: Elevation-3

Left Column (Form Fields):
├── Gap between inputs: 16px
├── Input height: 48px
├── Input border: 2px solid var(--border) 50%
├── Focus state: Border → var(--primary)
└── Grid for Price/Qty: 2 columns, 16px gap

Right Column (Image Upload):
├── Min height: 200px
├── Border: 2px dashed var(--border) 50%
├── Border Radius: 8px
├── Hover: Border → var(--primary) 70%
├── Dragging: Border solid, Background var(--primary) 10%
└── Preview: Image fills container, object-fit: cover
```

#### Product Card Specifications
```
Card Dimensions: 240px x 300px (flexible)
├── Image Container: 100% x 128px
│   ├── Border Radius: 8px top
│   ├── Object Fit: Cover
│   └── Placeholder: Gray-600 BG, 📦 icon 40px
│
├── Content Padding: 16px
├── Name: 16px Bold, Truncate with ellipsis
├── Category: 14px Regular, Text-Secondary
├── Price: 20px Bold, Primary color
└── Stock: 14px Regular, Text-Secondary

States:
├── Default: Border 1px var(--border) 30%
├── Hover: Border var(--primary) 50%, Scale 1.05, Shadow
└── Transition: All 300ms ease
```

---

### 3. ANALYSIS PAGE

#### Mode Selection (Home State)
```
┌─────────────────────────────────────────────────────────────────┐
│  Analysis Center                                                │
│  Select an analysis mode to begin                              │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐                   │
│  │   👥             │  │   📊             │                   │
│  │                  │  │                  │                   │
│  │ All Workers      │  │ Compare Workers  │                   │
│  │ Overview         │  │                  │                   │
│  │                  │  │                  │                   │
│  │ View performance │  │ Side-by-side     │                   │
│  │ of all workers   │  │ comparison       │                   │
│  │                  │  │                  │                   │
│  │ [Start →]        │  │ [Start →]        │                   │
│  └──────────────────┘  └──────────────────┘                   │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐                   │
│  │   🔍             │  │   🤖             │                   │
│  │                  │  │                  │                   │
│  │ Worker Insight   │  │ AI Predictions   │                   │
│  │                  │  │                  │                   │
│  │ Deep dive into   │  │ Machine learning │                   │
│  │ individual stats │  │ forecasts        │                   │
│  │                  │  │                  │                   │
│  │ [Start →]        │  │ [Start →]        │                   │
│  └──────────────────┘  └──────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘

Mode Cards:
├── Size: Flexible (min 280px)
├── Layout: 2-column grid (desktop), 1-column (mobile)
├── Background: var(--card-bg) 80%
├── Border: 1px solid var(--border) 50%
├── Border Radius: 24px
├── Padding: 24px
│
├── Icon Size: 64px emoji
├── Title: 24px Bold
├── Description: 16px Regular, Text-Secondary
│
├── Hover Effects:
│   ├── Scale: 1.05
│   ├── Border: var(--primary) 80%
│   ├── Shadow: var(--primary) 20% glow
│   └── Shimmer overlay animation
│
└── Click: Navigate to selected mode
```

#### All Workers Overview Mode
```
┌─────────────────────────────────────────────────────────────────┐
│  All Workers Overview                    [← Back to Modes]     │
│  Dive deep into your business data                             │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  📊 Summary Statistics                                   │  │
│  │  ───────────────────────────────────────────────────────│  │
│  │  Total Sales: ₱50,000  |  Total Expenses: ₱12,000       │  │
│  │  Active Workers: 8     |  Avg Sales/Worker: ₱6,250      │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Worker Performance Table                                │  │
│  │  ───────────────────────────────────────────────────────│  │
│  │  Name         Sales    Expenses  Net Profit  Efficiency  │  │
│  │  ──────────   ──────   ───────   ─────────   ─────────  │  │
│  │  Juan Dela    ₱8,500   ₱1,200    ₱7,300      85%       │  │
│  │  Maria Cruz   ₱7,200   ₱900      ₱6,300      88%       │  │
│  │  Pedro Santos ₱6,800   ₱1,100    ₱5,700      84%       │  │
│  │  ...                                                     │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────┐  ┌──────────────────────────┐   │
│  │  Sales by Worker        │  │  Top Performers          │   │
│  │  [Bar Chart]            │  │  1. Maria (₱7,200)       │   │
│  │                         │  │  2. Juan (₱8,500)        │   │
│  └─────────────────────────┘  └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

### 4. SETTINGS PAGE

#### Visual Layout
```
┌─────────────────────────────────────────────────────────────────┐
│  Settings                                                       │
│  Configure your application and manage users                   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  🎨 Theme Selector                                        │  │
│  │  ─────────────────────────────────────────────────────   │  │
│  │  Choose your preferred color theme                        │  │
│  │                                                           │  │
│  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐              │  │
│  │  │🔥CH │ │🌊OC │ │🌲FO │ │🌅SU │ │☀️LI │              │  │
│  │  │     │ │     │ │     │ │     │ │     │              │  │
│  │  │Char │ │Ocean│ │Fore │ │Suns │ │Ligh │              │  │
│  │  │noks │ │     │ │st   │ │et   │ │t    │              │  │
│  │  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘              │  │
│  │                                                           │  │
│  │  [9 theme options in scrollable grid...]                 │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  👥 Create Worker Account                                 │  │
│  │  ─────────────────────────────────────────────────────   │  │
│  │  ┌────────────────┐  ┌────────────────────────────────┐ │  │
│  │  │ Full Name      │  │ Email Address                  │ │  │
│  │  │ [___________]  │  │ [___________________________]  │ │  │
│  │  └────────────────┘  └────────────────────────────────┘ │  │
│  │  Temporary Password                                       │  │
│  │  [___________________________________________]            │  │
│  │                                    [Create Account ✓]    │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  👨‍💼 User Management                                         │  │
│  │  ─────────────────────────────────────────────────────   │  │
│  │  Name         Email           Status    Created  Actions  │  │
│  │  ──────────   ──────────────  ───────   ───────  ──────  │  │
│  │  Juan Dela    juan@email.com  🟢Active  Jan 15   [Deact] │  │
│  │  Maria Cruz   maria@email.com 🟢Active  Jan 20   [Promo] │  │
│  │  ...                                                      │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  💾 Data Backup                                           │  │
│  │  ─────────────────────────────────────────────────────   │  │
│  │  Create a complete backup of your business data          │  │
│  │                                                           │  │
│  │  [Create Backup 📥]                                       │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  🗄️ IndexedDB Test                                        │  │
│  │  ─────────────────────────────────────────────────────   │  │
│  │  Test offline storage for AI workflow                     │  │
│  │                                                           │  │
│  │  [Test IndexedDB 🧪]                                      │  │
│  │                                                           │  │
│  │  ✅ IndexedDB Working! Created notes:1, products:2...    │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

Theme Card Specs:
├── Size: 120px x 140px
├── Preview area: 120px x 80px with gradient
├── Label: 14px Medium, centered
├── Border: 2px solid transparent
├── Active state: Border var(--primary), checkmark overlay
└── Hover: Scale 1.05, shadow
```

---

## 👷 WORKER PAGES

### 1. WORKER DASHBOARD

#### Visual Layout
```
┌─────────────────────────────────────────────────────────────────┐
│  Dashboard                                                      │
│  Here's your summary for today                                 │
│                                                                 │
│  ┌───────────────────────┐  ┌───────────────────────────────┐ │
│  │  🛒                   │  │  💰                           │ │
│  │                       │  │                               │ │
│  │  YOUR SALES TODAY     │  │  YOUR REVENUE TODAY           │ │
│  │                       │  │                               │ │
│  │       42              │  │       ₱12,500                 │ │
│  │                       │  │                               │ │
│  └───────────────────────┘  └───────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  👋 Ready to start your day?                             │  │
│  │                                                           │  │
│  │  You haven't recorded any sales today yet.               │  │
│  │  Click the button below to get started!                  │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │              + Record a New Sale                          │  │
│  │                                                           │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

Specifications:
├── KPI Cards: 2-column grid, full width on mobile
├── Welcome Card: Only shows when salesToday === 0
├── Record Sale Button:
│   ├── Width: 100%
│   ├── Height: 96px
│   ├── Background: var(--primary)
│   ├── Font: 32px Bold, White
│   ├── Border Radius: 24px
│   ├── Shadow: Elevation-3
│   ├── Hover: Scale 1.05
│   └── Animation: slide-in-bottom
```

---

### 2. SALES PAGE (Worker)

#### Desktop Layout (Split Screen)
```
┌─────────────────────────────────────────────────────────────────┐
│  PRODUCT AREA (60%)              │  CART AREA (40%)             │
│  ──────────────────────────────  │  ──────────────────────────  │
│  Record Sale                      │  Current Sale                │
│  Tap products to add to cart     │                              │
│                                   │  🎙️ [Voice Input Button]     │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐        │                              │
│  │📦 │ │📦 │ │📦 │ │📦 │        │  ┌─────────────────────────┐│
│  │IMG│ │IMG│ │IMG│ │IMG│        │  │ 📦 Chicken    x2  ₱180 ││
│  │   │ │   │ │   │ │   │        │  │ [−] 2 [+]              ││
│  │CH │ │FR │ │DR │ │RI │        │  └─────────────────────────┘│
│  │₱90│ │₱50│ │₱25│ │₱30│        │  ┌─────────────────────────┐│
│  └───┘ └───┘ └───┘ └───┘        │  │ 📦 Fries      x1  ₱50  ││
│                                   │  │ [−] 1 [+]              ││
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐        │  └─────────────────────────┘│
│  │... More Products              │                              │
│  └───┘ └───┘ └───┘ └───┘        │  (Scrollable cart items)     │
│                                   │                              │
│  (Scrollable grid)                │  ──────────────────────────  │
│                                   │  Total:        ₱230          │
│                                   │  Received:     ₱500 [Edit]   │
│                                   │  Change:       ₱270          │
│                                   │                              │
│                                   │  ┌─────────────────────────┐│
│                                   │  │                         ││
│                                   │  │     SAVE SALE           ││
│                                   │  │                         ││
│                                   │  └─────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘

Dimensions:
├── Product Area: 60% width (864px on 1440px screen)
├── Cart Area: 40% width (576px on 1440px screen)
├── Product Cards: 4 columns (XL), 3 (MD), 2 (SM)
├── Product Card Size: ~180px x 220px
└── Cart Height: Full viewport minus header
```

#### Mobile Layout (Stacked)
```
┌────────────────────────────┐
│  Record Sale               │
│  ──────────────────────    │
│  🎙️ [Voice Input Button]   │
│                            │
│  ┌────┐ ┌────┐            │
│  │📦  │ │📦  │            │
│  │    │ │    │            │
│  │CH  │ │FR  │            │
│  │₱90 │ │₱50 │            │
│  └────┘ └────┘            │
│                            │
│  [More products...]        │
│                            │
│  ──────────────────────    │
│  CART (Fixed Bottom)       │
│  ──────────────────────    │
│  Items: 3                  │
│  Total: ₱230  [View Cart]  │
│                            │
│  [SAVE SALE]               │
└────────────────────────────┘

Mobile Specific:
├── Cart: Fixed bottom bar or full-screen modal
├── Product Grid: 2 columns
├── Voice Button: Prominent at top
└── Save Button: Full width, sticky bottom
```

#### Cart Item Specifications
```
Cart Item Layout:
┌────────────────────────────────────┐
│ [📦 Image] Product Name       ₱180 │
│ 48x48      [−] 2 [+]              │
└────────────────────────────────────┘

├── Background: rgba(255,255,255,0.05)
├── Border Radius: 8px
├── Padding: 8px
├── Gap: 12px
├── Layout: Horizontal flex
│
├── Image: 48px x 48px, rounded
├── Name: 16px Bold, flex-grow
├── Quantity Controls:
│   ├── Background: rgba(255,255,255,0.1)
│   ├── Border Radius: 6px
│   ├── Buttons: 40px width, 32px height
│   ├── Number: 32px width, centered
│   └── Font: 18px Bold
│
└── Price: 16px Bold, right-aligned
```

#### Number Pad Modal
```
Desktop (Center):               Mobile (Bottom Sheet):
┌─────────────────────┐        ┌────────────────────────┐
│                     │        │                        │
│   ┌───┐ ┌───┐ ┌───┐│        │  ┌───┐ ┌───┐ ┌───┐   │
│   │ 1 │ │ 2 │ │ 3 ││        │  │ 1 │ │ 2 │ │ 3 │   │
│   └───┘ └───┘ └───┘│        │  └───┘ └───┘ └───┘   │
│   ┌───┐ ┌───┐ ┌───┐│        │  ┌───┐ ┌───┐ ┌───┐   │
│   │ 4 │ │ 5 │ │ 6 ││        │  │ 4 │ │ 5 │ │ 6 │   │
│   └───┘ └───┘ └───┘│        │  └───┘ └───┘ └───┘   │
│   ┌───┐ ┌───┐ ┌───┐│        │  ┌───┐ ┌───┐ ┌───┐   │
│   │ 7 │ │ 8 │ │ 9 ││        │  │ 7 │ │ 8 │ │ 9 │   │
│   └───┘ └───┘ └───┘│        │  └───┘ └───┘ └───┘   │
│   ┌───┐ ┌───┐ ┌───┐│        │  ┌───┐ ┌───┐ ┌───┐   │
│   │ . │ │ 0 │ │ ⌫ ││        │  │ . │ │ 0 │ │ ⌫ │   │
│   └───┘ └───┘ └───┘│        │  └───┘ └───┘ └───┘   │
│   ┌─────────────────┐│        │  ┌──────────────────┐│
│   │      DONE       ││        │  │      DONE        ││
│   └─────────────────┘│        │  └──────────────────┘│
└─────────────────────┘        └────────────────────────┘

Specifications:
├── Container: 384px max-width
├── Grid: 3 columns, 8px gap
├── Key Size: 64px height
├── Key Background: rgba(255,255,255,0.1)
├── Key Font: 24px Bold
├── Active State: Background var(--primary), Scale 1.05
├── Done Button: Full width, var(--primary)
└── Border Radius: 8px (keys), 24px (container)
```

---

## 🔐 AUTHENTICATION PAGES

### LOGIN PAGE

#### Visual Layout
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                      [Animated Gradient Background]             │
│                                                                 │
│                    ┌──────────────────────┐                    │
│                    │                      │                    │
│                    │   ┌────────────┐     │                    │
│                    │   │  ┌──────┐  │     │                    │
│                    │   │  │ LOGO │  │     │                    │
│                    │   │  └──────┘  │     │                    │
│                    │   └────────────┘     │                    │
│                    │    96x96 Gradient    │                    │
│                    │                      │                    │
│                    │   ┌──────────────┐   │                    │
│                    │   │ [Logo] CHARNOKS  │                    │
│                    │   └──────────────┘   │                    │
│                    │   Point of Sale      │                    │
│                    │   🍗 Fried Chicken   │                    │
│                    │                      │                    │
│                    │   ✨ Welcome Back    │                    │
│                    │                      │                    │
│                    │   Sign in to manage  │                    │
│                    │                      │                    │
│                    │   ┌────────────────┐ │                    │
│                    │   │ 👤 [Email]     │ │                    │
│                    │   └────────────────┘ │                    │
│                    │                      │                    │
│                    │   ┌────────────────┐ │                    │
│                    │   │ 🔒 [Password]👁│ │                    │
│                    │   └────────────────┘ │                    │
│                    │                      │                    │
│                    │   ☑ Remember Me      │                    │
│                    │   Forgot password?   │                    │
│                    │                      │                    │
│                    │   ┌────────────────┐ │                    │
│                    │   │     LOGIN      │ │                    │
│                    │   └────────────────┘ │                    │
│                    │                      │                    │
│                    │   Don't have account?│                    │
│                    │      Sign Up         │                    │
│                    └──────────────────────┘                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Specifications:
├── Background: Linear gradient (animated)
│   ├── Start: var(--background-start)
│   ├── End: var(--background-end)
│   ├── Size: 400% 400%
│   └── Animation: gradient-x 15s infinite
│
├── Container: Max 384px width, centered
├── Logo Container:
│   ├── Size: 96px x 96px
│   ├── Background: linear-gradient(Orange-500, Yellow-500)
│   ├── Border Radius: 16px
│   ├── Padding: 8px
│   ├── Shadow: Elevation-5
│   └── Animation: bounce-in 600ms
│
├── Brand Title:
│   ├── Font: 48px Bold
│   ├── Color: White
│   ├── Letter Spacing: 0.05em
│   └── Animation: bounce-in 600ms (delay 150ms)
│
├── Input Fields:
│   ├── Container: Accent/20 background
│   ├── Border Radius: 8px
│   ├── Height: 48px
│   ├── Icon: 20px, padding-left 12px
│   ├── Input: Transparent BG, white text
│   └── Focus: Border white/50
│
└── Login Button:
    ├── Width: 100%
    ├── Height: 48px
    ├── Background: var(--card-bg-solid)
    ├── Font: 16px Bold
    ├── Shadow: Elevation-2, black/20
    └── Hover: Opacity 90%
```

### SIGN UP PAGE

Similar to Login with additional fields:
```
Additional Elements:
├── Display Name input (above email)
├── Confirm Password input (below password)
├── Role selector (Owner/Worker) - if applicable
└── Terms & Conditions checkbox
```

---

## 🧩 SHARED COMPONENTS

### KPI Card (Detailed Breakdown)
```
┌────────────────────────────────────┐
│  LABEL (Uppercase)          [ICON] │
│  Total Revenue              💰     │
│                                    │
│  ₱50,000                           │
│  (Value - Large Bold)              │
│                                    │
│  +12.5% ▲    [Sparkline Chart]    │
│  (Trend)      ─────────────────    │
└────────────────────────────────────┘

Exact Measurements:
├── Outer Container: 280px x 140px (flexible width)
├── Padding: 24px all sides
├── Border Radius: 24px
├── Background: var(--card-bg) 80% with blur(12px)
├── Border: 1px solid var(--border) 50%
├── Shadow: 0 10px 15px -3px rgba(0,0,0,0.1)
│
├── Header Row (Flex Horizontal, Space Between):
│   ├── Label Column (Flex Vertical):
│   │   ├── Title: 12px SemiBold, Text-Secondary, Uppercase
│   │   ├── Letter Spacing: 0.05em
│   │   └── Margin Bottom: 4px
│   │
│   └── Icon Container:
│       ├── Size: 48px x 48px
│       ├── Border Radius: 12px
│       ├── Background: Linear Gradient
│       │   └── From Primary/20 to Accent/20
│       ├── Icon: 20px emoji, centered
│       └── Hover: Transform scale(1.1), 300ms
│
├── Value:
│   ├── Font: 30px Bold (H3)
│   ├── Color: Text-Primary (White)
│   ├── Line Height: 1
│   └── Margin Bottom: 16px
│
└── Footer Row (Flex Horizontal, Space Between):
    ├── Trend:
    │   ├── Font: 14px Medium
    │   ├── Color: Success (green) or Error (red)
    │   ├── Icon: ▲ or ▼ (12px)
    │   └── Gap: 6px between icon and text
    │
    └── Sparkline (Optional):
        ├── Size: 60px x 20px
        ├── SVG Polyline
        ├── Stroke: 1.5px, color based on trend
        └── Opacity: 60%
```

### Modern Card (Container)
```
Standard Glass Card:
├── Background: var(--card-bg) with 80% opacity
├── Backdrop Filter: blur(12px)
├── Border: 1px solid var(--border) with 50% opacity
├── Border Radius: 24px
├── Padding: 24px
├── Shadow: 0 10px 15px -3px rgba(0,0,0,0.1)
│
└── Usage: Wraps charts, forms, content sections
```

### Voice Input Button
```
┌──────────────────────────────────────────┐
│                                          │
│  🎙️  Voice Input                        │
│  (or "Listening..." with pulse)          │
│                                          │
└──────────────────────────────────────────┘

States:
├── Idle:
│   ├── Background: White/10
│   ├── Text: "🎙️ Voice Input"
│   ├── Font: 18px SemiBold
│   └── Border: 2px solid Border/50
│
├── Listening:
│   ├── Background: Red-500/30
│   ├── Text: "Listening..."
│   ├── Icon: Animated pulse dot
│   └── Border: 2px solid Red-500
│
├── Processing:
│   ├── Background: Blue-500/30
│   ├── Text: "Processing..."
│   ├── Spinner animation
│   └── Border: 2px solid Blue-500
│
└── Error:
    ├── Background: Red-500/30
    ├── Text: Error message
    ├── Icon: ⚠️
    └── Border: 2px solid Red-500

Dimensions:
├── Width: 100%
├── Height: 48px
├── Border Radius: 9999px (full rounded)
├── Padding: 12px 20px
└── Transition: All 300ms
```

---

## 📊 VISUAL FLOW DIAGRAMS

### User Flow: Owner Journey
```
                    [Login]
                       │
                       ↓
              ┌─────────────────┐
              │ Owner Dashboard │
              └─────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ↓              ↓              ↓
   [Products]     [Analysis]    [Settings]
        │              │              │
        ↓              ↓              ↓
   Add/Edit      View Reports   Manage Users
   Products      AI Insights    Create Workers
                                Backup Data
```

### User Flow: Worker Journey
```
                    [Login]
                       │
                       ↓
              ┌──────────────────┐
              │ Worker Dashboard │
              └──────────────────┘
                       │
                       ↓
                 [Record Sale]
                       │
          ┌────────────┼────────────┐
          │            │            │
          ↓            ↓            ↓
    Select       Use Voice      Enter
    Products      Input         Payment
          │            │            │
          └────────────┼────────────┘
                       │
                       ↓
                  [Save Sale]
                       │
                       ↓
                  ✓ Success
```

### Data Flow: Sales Process
```
Worker selects products
        │
        ↓
Items added to cart
        │
        ↓
Worker enters payment
        │
        ↓
System calculates change
        │
        ↓
Worker saves sale
        │
        ↓
┌───────┴────────┐
│                │
↓                ↓
Online         Offline
│                │
↓                ↓
Save to        Save to
Supabase      IndexedDB
│                │
↓                ↓
✓ Done       Queue for sync
               │
               ↓
          When online
               │
               ↓
          Sync to DB
               │
               ↓
            ✓ Done
```

---

## 📐 RESPONSIVE BEHAVIOR

### Breakpoint Transformation Examples

#### Dashboard KPI Cards
```
Desktop (>1024px):
┌─────────┐ ┌─────────┐ ┌─────────┐
│ Revenue │ │ Profit  │ │ Trans.  │
└─────────┘ └─────────┘ └─────────┘

Tablet (640-1024px):
┌─────────┐ ┌─────────┐
│ Revenue │ │ Profit  │
└─────────┘ └─────────┘
┌─────────┐
│ Trans.  │
└─────────┘

Mobile (<640px):
┌─────────┐
│ Revenue │
└─────────┘
┌─────────┐
│ Profit  │
└─────────┘
┌─────────┐
│ Trans.  │
└─────────┘
```

#### Navigation Transform
```
Desktop:
┌─────────┬──────────────────┐
│ Sidebar │  Main Content    │
│ (Fixed) │                  │
└─────────┴──────────────────┘

Mobile:
┌──────────────────────────┐
│ Header    [☰]            │
├──────────────────────────┤
│  Main Content            │
│                          │
│  (Sidebar slides from    │
│   left when menu tapped) │
└──────────────────────────┘
```

---

## 🎨 COLOR VARIATIONS REFERENCE

### All Theme Previews

#### Charnoks Classic (Default)
```
Background: 🔥 Orange to Yellow gradient
Primary: Red-600
Cards: Brown with warm tones
Best for: High energy, food business
```

#### Ocean
```
Background: 🌊 Dark blue to Navy
Primary: Blue-500
Cards: Deep blue tones
Best for: Professional, calm
```

#### Forest
```
Background: 🌲 Dark green to Forest
Primary: Green-500
Cards: Deep green tones
Best for: Natural, eco-friendly
```

#### Sunset
```
Background: 🌅 Purple to Violet
Primary: Purple-500
Cards: Deep purple tones
Best for: Luxury, premium
```

#### Light Mode
```
Background: ☀️ Light gray gradient
Primary: Blue-600
Cards: White with subtle shadows
Best for: Daytime use, accessibility
```

---

**Document Version**: 1.0  
**Pages Covered**: 10+ pages (Owner & Worker)  
**Components Documented**: 25+ components  
**Total Specifications**: 500+ detailed measurements  
**Format**: Ready for Figma/Sketch/Adobe XD import
