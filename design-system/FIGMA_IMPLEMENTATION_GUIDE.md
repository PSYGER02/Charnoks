# CHARNOKS POS - FIGMA DESIGN GUIDE
## Complete Component Library & Implementation Specifications

---

## 📋 TABLE OF CONTENTS
1. [Figma Setup Instructions](#figma-setup)
2. [Component Library](#component-library)
3. [Page Templates](#page-templates)
4. [Responsive Layouts](#responsive-layouts)
5. [Animation Specifications](#animations)
6. [Implementation Notes](#implementation)

---

## 🎨 FIGMA SETUP INSTRUCTIONS

### 1. Create New Figma File
- **File Name**: "CHARNOKS POS - Design System"
- **Canvas Size**: 1440px x 1024px (Desktop), 375px x 812px (Mobile), 768px x 1024px (Tablet)

### 2. Set Up Design Tokens (Figma Variables)

#### Colors (Create Color Styles)
```
Primary Colors:
├── Primary/Default: #DC2626 (rgb 220, 38, 38)
├── Primary/Hover: #DC2626 with 80% opacity
├── Secondary: #F59E0B (rgb 245, 158, 11)
├── Accent: #FDE047 (rgb 253, 224, 71)

Text Colors:
├── Text/Primary: #FFFFFF
├── Text/Secondary: #E5E7EB (rgb 229, 231, 235)
├── Text/On-Primary: #FFFFFF

Background:
├── Gradient Start: #DB4E2A (rgb 219, 78, 42)
├── Gradient End: #FCB93B (rgb 252, 185, 59)
├── Card BG: #78350F with 50% opacity
├── Card BG Solid: #78350F

Border:
├── Border/Default: #F59E0B with 50% opacity
├── Border/Hover: #F59E0B with 70% opacity

Status:
├── Success: #22C55E (rgb 34, 197, 94)
├── Warning: #EAB308 (rgb 234, 179, 8)
├── Error: #EF4444 (rgb 239, 68, 68)
├── Info: #3B82F6 (rgb 59, 130, 246)
```

#### Typography (Create Text Styles)
```
Font Family: Poppins (Download from Google Fonts)

Headings:
├── H1: 48px / Bold / Line height 1.2
├── H2: 36px / Bold / Line height 1.2
├── H3: 30px / Bold / Line height 1.25
├── H4: 24px / SemiBold / Line height 1.3

Body:
├── Body Large: 18px / Regular / Line height 1.5
├── Body: 16px / Regular / Line height 1.5
├── Body Small: 14px / Regular / Line height 1.5
├── Caption: 12px / Medium / Line height 1.5

Buttons:
├── Button Large: 20px / Bold / Line height 1
├── Button Medium: 16px / Bold / Line height 1
├── Button Small: 14px / SemiBold / Line height 1
```

#### Spacing (Create as Figma Variables)
```
Spacing Scale:
├── XS: 4px
├── SM: 8px
├── MD: 16px
├── LG: 24px
├── XL: 32px
├── 2XL: 48px
├── 3XL: 64px
```

#### Border Radius
```
├── SM: 6px
├── MD: 8px
├── LG: 12px
├── XL: 16px
├── 2XL: 24px
├── Full: 9999px
```

#### Shadows (Create Effect Styles)
```
Elevation-1 (sm): 
  └── Drop Shadow: 0px 1px 2px rgba(0,0,0,0.05)

Elevation-2 (md):
  └── Drop Shadow: 0px 4px 6px rgba(0,0,0,0.1)

Elevation-3 (lg):
  └── Drop Shadow: 0px 10px 15px rgba(0,0,0,0.1)

Elevation-4 (xl):
  └── Drop Shadow: 0px 20px 25px rgba(0,0,0,0.1)

Elevation-5 (2xl):
  └── Drop Shadow: 0px 25px 50px rgba(0,0,0,0.25)
```

---

## 🧩 COMPONENT LIBRARY

### BUTTON COMPONENTS

#### 1. Primary Button
**Figma Auto Layout Settings:**
```
Size: Variable (Hug Contents)
Padding: 12px (top/bottom), 24px (left/right)
Gap: 8px (if icon present)
Fill: Primary Color (#DC2626)
Border Radius: 8px
Text Style: Button Medium
Text Color: White

Effects:
├── Shadow: Elevation-2
└── Hover: Fill opacity 80%, Scale 105%

States to Create:
├── Default
├── Hover
├── Pressed (Scale 95%)
├── Disabled (Opacity 50%)
└── Loading (with spinner)
```

**Variants:**
- Small: padding 8px/16px, text 14px
- Medium: padding 12px/24px, text 16px  
- Large: padding 16px/32px, text 20px

#### 2. Secondary Button
```
Same as Primary but:
Fill: rgba(255,255,255,0.1)
Text Color: var(--text-primary)
Hover Fill: rgba(255,255,255,0.2)
```

#### 3. Icon Button
```
Size: 48px x 48px (minimum touch target)
Padding: 12px
Icon Size: 24px x 24px
Border Radius: Full (9999px) or 8px
```

#### 4. Navigation Button (Sidebar)
**Default State:**
```
Auto Layout: Horizontal
Padding: 12px
Gap: 16px
Fill: Transparent
Border Radius: 8px

Elements:
├── Icon Frame: 24px x 24px, emoji/icon
└── Label: Body text, Text/Secondary color

Hover:
├── Fill: rgba(255,255,255,0.1)
└── Text Color: Text/Primary
```

**Active State:**
```
Fill: Primary with 80% opacity
Text Color: White
Shadow: Elevation-2
```

### CARD COMPONENTS

#### 1. KPI Card (Metric Card)
**Figma Frame Structure:**
```
Size: 280px x 140px (flexible width)
Auto Layout: Vertical
Padding: 24px
Gap: 16px
Fill: var(--card-bg) with Backdrop Blur effect
Border: 1px solid var(--border)
Border Radius: 24px
Shadow: Elevation-3

Layout Structure:
┌─────────────────────────────────┐
│  [Header Row - Horizontal]      │
│    ├── [Left Column - Vertical] │
│    │     ├── Title (Caption)    │
│    │     └── Value (H3)         │
│    └── [Icon Container]         │
│          48px x 48px            │
│                                 │
│  [Footer Row - Horizontal]      │
│    ├── Trend (Body Small)       │
│    └── Sparkline (optional)     │
└─────────────────────────────────┘

Elements:
1. Title:
   ├── Text: Caption style
   ├── Color: Text/Secondary
   ├── Transform: Uppercase
   └── Letter Spacing: 0.05em

2. Value:
   ├── Text: H3 (30px Bold)
   ├── Color: Text/Primary
   └── Line Height: 1

3. Icon Container:
   ├── Size: 48px x 48px
   ├── Fill: Linear Gradient (Primary/20% to Accent/20%)
   ├── Border Radius: 12px
   ├── Icon: 20px emoji/icon, centered
   └── Hover: Scale 110%

4. Trend Indicator:
   ├── Text: Body Small (14px Medium)
   ├── Color: Success/Error based on direction
   ├── Icon: ▲ or ▼ (12px)
   └── Gap: 6px between icon and text
```

#### 2. Product Card
**Figma Frame Structure:**
```
Size: 240px x 300px
Auto Layout: Vertical
Padding: 16px
Gap: 12px
Fill: rgba(120,53,15,0.5)
Border: 1px solid rgba(245,158,11,0.3)
Border Radius: 12px
Hover: Border color to Primary/50%, Scale 105%

Layout:
┌─────────────────────┐
│  [Image Container]  │
│     200px x 128px   │
│     Border Radius   │
│         8px         │
│                     │
│  [Product Name]     │
│    Bold, Truncate   │
│                     │
│  [Category]         │
│   Small, Secondary  │
│                     │
│  [Bottom Row - Flex]│
│   ├── Price (H4)    │
│   └── Stock (Small) │
└─────────────────────┘

Image States:
├── With Image: object-fit: cover
└── Placeholder: Gray BG with 📦 icon (40px)
```

#### 3. Modern Card (General Container)
```
Auto Layout: Vertical
Padding: 24px
Fill: var(--card-bg) with 80% opacity
Backdrop Blur: 12px
Border: 1px solid var(--border) with 50% opacity
Border Radius: 24px
Shadow: Elevation-3

Usage: Charts, forms, content sections
```

### FORM COMPONENTS

#### 1. Text Input
**Figma Setup:**
```
Auto Layout: Horizontal
Size: Flexible width x 48px height
Padding: 12px
Border: 2px solid var(--border) with 50% opacity
Border Radius: 8px
Fill: Transparent

States:
├── Default: Border var(--border)/50%
├── Focus: Border var(--primary), no outline
├── Error: Border red, helper text below
└── Disabled: Opacity 50%

Text:
├── Font: Body (16px Regular)
├── Color: Text/Primary
└── Placeholder: Text/Primary with 60% opacity
```

#### 2. Input with Icon
**Structure:**
```
Container:
├── Auto Layout: Horizontal
├── Padding: 4px
├── Fill: var(--accent) with 20% opacity
├── Border Radius: 8px
└── Gap: 0px

Elements:
├── Icon Container:
│   ├── Padding: 12px
│   └── Icon: 20px, color White/70%
│
└── Input Field:
    ├── Fill: Transparent
    ├── Padding: 10px 12px
    ├── Text: 16px, White
    └── No border
```

#### 3. File Upload (Drag & Drop)
```
Size: Flexible x 200px minimum
Auto Layout: Vertical
Padding: 24px
Border: 2px dashed var(--border) with 50% opacity
Border Radius: 8px
Fill: Transparent
Cursor: Pointer

Center Content:
├── Icon: 📸 48px
├── Title: "Click to upload or drag & drop"
├── Subtitle: "PNG, JPG, GIF up to 10MB"

States:
├── Hover: Border Primary/70%
└── Dragging: Border Primary solid, Fill Primary/10%
```

### NAVIGATION COMPONENTS

#### 1. Sidebar (Desktop)
**Figma Frame:**
```
Size: 256px x Full Height
Position: Fixed Left
Auto Layout: Vertical
Padding: 16px
Fill: rgba(0,0,0,0.2)
Backdrop Blur: 12px

Structure:
┌──────────────────┐
│  [Header - 64px] │
│    Logo + Brand  │
│                  │
│  [Nav - Flex]    │
│    ├── Item 1    │
│    ├── Item 2    │
│    └── ...       │
│                  │
│  [Footer - Auto] │
│    Logout Button │
└──────────────────┘

Header:
├── Height: 64px
├── Layout: Horizontal, Space Between
├── Logo: 32px x 32px
└── Brand Text: H4, Bold, Letter-spacing 0.05em

Nav Items:
├── Auto Layout: Vertical
├── Gap: 4px
└── Each item 48px height minimum
```

#### 2. Mobile Header
```
Size: Full Width x 64px
Auto Layout: Horizontal, Space Between
Padding: 16px
Fill: rgba(0,0,0,0.2)
Backdrop Blur: 12px
Border Bottom: 1px solid var(--border) with 30% opacity
Position: Sticky Top

Elements:
├── Page Title: H4
└── Menu Button: 48px x 48px (hamburger icon)
```

#### 3. Mobile Sidebar Overlay
```
Full Screen Overlay:
├── Fill: rgba(0,0,0,0.6)
├── Backdrop Blur: 12px
└── Z-index: 40

Sidebar:
├── Width: 256px
├── Height: Full
├── Position: Fixed Left
├── Fill: rgba(0,0,0,0.5)
├── Backdrop Blur: 24px
└── Transform: translateX(-100%) → translateX(0)
```

### MODAL COMPONENTS

#### 1. Number Pad Modal
**Desktop Version:**
```
Overlay:
├── Fill: rgba(0,0,0,0.6)
├── Backdrop Blur: 12px
├── Position: Fixed, Full Screen
└── Center aligned

Container:
├── Size: 384px x Auto
├── Fill: var(--card-bg-solid)
├── Border Radius: 24px
├── Padding: 16px

Grid Layout:
├── 3 columns
├── Gap: 8px
├── Key Size: 64px height
└── Done button: Full width
```

**Mobile Version:**
```
Position: Fixed Bottom
Border Radius: 24px 24px 0 0
Slide up animation
```

#### 2. Confirmation Modal
```
Overlay: Same as Number Pad

Content:
├── Max Width: 448px
├── Fill: var(--card-bg-solid)
├── Border Radius: 16px
├── Padding: 24px
├── Border: 1px var(--border) with 30% opacity

Structure:
├── Title (H3)
├── Description (Body)
├── Content Area (flex)
└── Action Buttons (Horizontal, Gap 12px)
```

### OVERLAY COMPONENTS

#### 1. Success Overlay
**Figma Animation Specs:**
```
Full Screen:
├── Fill: rgba(0,0,0,0.5)
├── Backdrop Blur: 12px
├── Z-index: 50

Center Icon:
├── Circle: 128px diameter
├── Fill: Success Green (#22C55E)
├── Shadow: Elevation-5
└── Checkmark Icon: 80px, White, Stroke 2px

Animation:
├── Appear: Bounce-in (scale 0.3 → 1.05 → 0.9 → 1)
├── Duration: 600ms ease-out
└── Auto-hide: 1500ms
```

#### 2. Loading Spinner
```
Spinner:
├── Size: 32px (md), 24px (sm), 48px (lg)
├── Border: 3px solid
├── Border Color: Primary with 30% opacity
├── Border Top: Primary solid
├── Border Radius: Full
└── Animation: Spin 1s linear infinite
```

---

## 📱 PAGE TEMPLATES

### 1. LOGIN PAGE

**Canvas Setup:**
```
Size: 1440px x 900px (Desktop), 375px x 812px (Mobile)
Background: Linear Gradient (Gradient Start → Gradient End)
Background Animation: Gradient-X (moving diagonal)
```

**Layout Structure:**
```
Center Container:
├── Max Width: 384px
├── Auto Layout: Vertical
├── Gap: 24px
├── Padding: 16px

Elements in Order:
┌─────────────────────────┐
│  [Logo Container]       │
│    96px x 96px          │
│    Gradient BG          │
│    Logo Image 80px      │
│    Shadow Elevation-5   │
│    Animation: Bounce-in │
│                         │
│  [Brand Section]        │
│    ├── Logo + "CHARNOKS"│
│    ├── Subtitle         │
│    └── Tagline          │
│                         │
│  [Welcome Text]         │
│    "✨ Welcome Back"    │
│                         │
│  [Description]          │
│                         │
│  [Form - Vertical]      │
│    ├── Email Input      │
│    ├── Password Input   │
│    ├── Remember Me      │
│    └── Login Button     │
│                         │
│  [Sign Up Link]         │
└─────────────────────────┘

Spacing:
├── Logo to Brand: 16px
├── Brand to Welcome: 24px
├── Welcome to Form: 20px
├── Form inputs: 20px gap
└── Form to Link: 16px
```

**Component Instances:**
1. Logo Container:
   - 96x96 frame
   - Linear gradient: Orange-500 to Yellow-500
   - Border radius: 16px
   - Padding: 8px
   - Logo image: 80x80, object-fit contain

2. Brand Title:
   - Text: "CHARNOKS"
   - Size: 48px Bold
   - Color: White
   - Letter-spacing: 0.05em
   - Align: Center

3. Input Fields:
   - Use "Input with Icon" component
   - Email: User icon
   - Password: Lock icon + Eye toggle

### 2. OWNER DASHBOARD

**Canvas: 1440px x 1024px**

**Layout Grid:**
```
Container:
├── Sidebar: 256px (fixed left)
└── Main Content: Remaining width
    ├── Padding: 32px (desktop), 24px (tablet), 16px (mobile)
    └── Max Width: None

Structure:
┌──────────────────────────────────────┐
│  [Header]                            │
│    Title + Subtitle + Refresh        │
│    Height: Auto                      │
│    Margin Bottom: 32px               │
│                                      │
│  [KPI Grid - 3 columns]             │
│    Gap: 24px                        │
│    Margin Bottom: 24px              │
│    ├── Revenue Card                 │
│    ├── Profit Card                  │
│    └── Transactions Card            │
│                                      │
│  [Charts Grid - 2 columns]          │
│    Gap: 24px                        │
│    ├── Sales Trend (60% width)     │
│    └── Top Products (40% width)    │
│                                      │
│  [Empty State] (conditional)        │
│    Welcome message + Steps          │
└──────────────────────────────────────┘

Responsive Behavior:
├── Desktop (>1024px): 3 columns, side-by-side
├── Tablet (640-1024px): 2 columns
└── Mobile (<640px): 1 column, stacked
```

**Chart Specifications:**

Sales Trend (Area Chart):
```
Container: Modern Card
Height: 350px
Chart Type: Area with gradient fill

Visual Elements:
├── Grid Lines: Dashed, color var(--border)
├── X-Axis: Day names (Mon-Sun), Text/Secondary
├── Y-Axis: Numbers, Text/Secondary
├── Area Fill: Linear gradient (Primary 80% → Primary 0%)
├── Line: 2px solid Primary
└── Tooltip: Card-BG-Solid background, border
```

Top Products (Pie Chart):
```
Container: Modern Card
Height: 350px
Chart Type: Pie with labels

Visual Elements:
├── Colors: ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF"]
├── Label Position: Inside segments
├── Label Text: Percentage, White, 16px Bold
├── Outer Radius: 120px
└── Tooltip: Same as Area Chart
```

### 3. PRODUCTS PAGE

**Layout:**
```
┌─────────────────────────────────────┐
│  [Header]                           │
│    Title + Subtitle                 │
│                                     │
│  [Product Form Card]                │
│    2-Column Grid (desktop)          │
│    ├── Left: Form Fields           │
│    │   ├── Product Name             │
│    │   ├── Price + Quantity         │
│    │   └── Category                 │
│    └── Right: Image Upload          │
│                                     │
│  [Products List Card]               │
│    ├── Header (Title + Count + Refresh) │
│    └── Grid Layout                  │
│        4 cols (desktop)             │
│        3 cols (tablet)              │
│        2 cols (mobile)              │
│        └── Product Cards            │
└─────────────────────────────────────┘

Grid Spacing:
├── Form columns: 24px gap
├── Product grid: 16px gap
└── Sections: 32px vertical gap
```

### 4. WORKER DASHBOARD

**Simplified Layout:**
```
┌─────────────────────────────────────┐
│  [Header]                           │
│    Title + Subtitle                 │
│                                     │
│  [KPI Grid - 2 columns]            │
│    Gap: 24px                       │
│    ├── Sales Today Card            │
│    └── Revenue Today Card          │
│                                     │
│  [Empty State] (if no sales)       │
│    Welcome message                 │
│                                     │
│  [Record Sale Button]              │
│    Full width                      │
│    48px height                     │
│    Primary color                   │
│    Large text                      │
└─────────────────────────────────────┘

Button Specs:
├── Auto Layout: Horizontal, Center
├── Padding: 24px
├── Fill: Primary
├── Border Radius: 24px
├── Text: 24px Bold, White
├── Shadow: Elevation-3
└── Hover: Scale 105%
```

### 5. SALES PAGE (Worker)

**Split Screen Layout:**

Desktop (1440px):
```
┌─────────────────────────────────────────┐
│  [Product Area - 60%]  │ [Cart - 40%]   │
│                        │                 │
│  Header                │  Header         │
│  ├── Title             │  "Current Sale" │
│  └── Subtitle          │                 │
│                        │  Voice Input    │
│  Product Grid          │                 │
│  4 columns             │  Cart Items     │
│  ├── Product 1         │  (scrollable)   │
│  ├── Product 2         │                 │
│  ├── Product 3         │  Payment        │
│  └── ...               │  ├── Total      │
│                        │  ├── Received   │
│  (scrollable)          │  ├── Change     │
│                        │  └── Save Btn   │
└─────────────────────────────────────────┘

Widths:
├── Product Area: 60% (864px)
└── Cart Area: 40% (576px)
```

Mobile (375px):
```
Stacked Layout:
├── Product Area: Full width, scrollable
└── Cart Area: Fixed bottom or full screen modal
```

**Cart Area Specifications:**
```
Container:
├── Background: rgba(0,0,0,0.2)
├── Backdrop Blur: 24px
├── Padding: 16px
├── Auto Layout: Vertical
└── Display: Flex column

Sections:
1. Header:
   ├── Text: 24px Bold
   └── Margin Bottom: 16px

2. Voice Input:
   ├── Full width button
   ├── Height: 48px
   └── Margin Bottom: 16px

3. Cart Items:
   ├── Flex: 1 (grows to fill)
   ├── Overflow: Scroll
   ├── Gap: 8px between items
   └── Each item:
       ├── Layout: Horizontal
       ├── Background: rgba(255,255,255,0.05)
       ├── Padding: 8px
       ├── Border Radius: 8px
       └── Gap: 12px

4. Payment Section:
   ├── Border Top: 1px var(--border)
   ├── Padding Top: 16px
   ├── Margin Top: 16px
   └── Rows:
       ├── Total: 20px font, Primary color
       ├── Received: 24px font, Accent color, clickable
       ├── Change: 24px font, Success color
       └── Button: Full width, 64px height
```

---

## 📐 RESPONSIVE LAYOUTS

### Breakpoint System
```
Mobile:    < 640px
Tablet:    640px - 1024px  
Desktop:   > 1024px
Wide:      > 1280px
Ultra:     > 1536px
```

### Adaptive Grid Patterns

#### Dashboard KPI Grid
```
Desktop (>1024px):
├── Columns: 3
├── Gap: 24px
└── Card Width: ~400px

Tablet (640-1024px):
├── Columns: 2
├── Gap: 20px
└── Card Width: ~340px

Mobile (<640px):
├── Columns: 1
├── Gap: 16px
└── Card Width: Full
```

#### Product Grid
```
Ultra (>1536px):
├── Columns: 5
└── Gap: 16px

Desktop (1024-1536px):
├── Columns: 4
└── Gap: 16px

Tablet (640-1024px):
├── Columns: 3
└── Gap: 12px

Mobile (<640px):
├── Columns: 2
└── Gap: 12px
```

### Mobile Optimizations

#### Touch Targets
```
Minimum Size: 44px x 44px
Recommended: 48px x 48px
Spacing: 8px between targets
```

#### Mobile Navigation
```
Header:
├── Height: 64px
├── Position: Sticky top
├── Z-index: 30

Sidebar:
├── Width: 256px
├── Transform: translateX(-100%) default
├── Overlay: rgba(0,0,0,0.6) backdrop
└── Slide animation: 300ms ease-in-out
```

#### Mobile Forms
```
Input Height: 48px minimum
Font Size: 16px minimum (prevents iOS zoom)
Label Position: Above input
Error Text: Below input, 14px
```

---

## 🎬 ANIMATION SPECIFICATIONS

### 1. Gradient Background Animation

**Keyframes:**
```
@keyframes gradient-x {
  0% { background-position: 0% 50% }
  50% { background-position: 100% 50% }
  100% { background-position: 0% 50% }
}

Properties:
├── Duration: 15s
├── Timing: ease
├── Iteration: infinite
└── Background Size: 400% 400%
```

**Figma Prototype:**
- Use Smart Animate between frames
- Background position: 0% 50% → 100% 50% → 0% 50%
- Duration: 15000ms
- Easing: Ease In and Out

### 2. Bounce-In Animation

**Keyframes:**
```
@keyframes bounce-in {
  0% { opacity: 0, scale: 0.3 }
  50% { opacity: 1, scale: 1.05 }
  70% { scale: 0.9 }
  100% { scale: 1 }
}

Properties:
├── Duration: 600ms
├── Timing: ease-out
└── Fill Mode: both
```

**Figma Prototype:**
- Frame 1: Opacity 0%, Scale 30%
- Frame 2 (300ms): Opacity 100%, Scale 105%
- Frame 3 (420ms): Scale 90%
- Frame 4 (600ms): Scale 100%
- Easing: Ease Out

### 3. Slide-In-Bottom

**Keyframes:**
```
@keyframes slide-in-bottom {
  from { 
    transform: translateY(100%)
    opacity: 0 
  }
  to { 
    transform: translateY(0)
    opacity: 1 
  }
}

Properties:
├── Duration: 500ms
├── Timing: cubic-bezier(0.25, 0.46, 0.45, 0.94)
└── Fill Mode: both
```

**Figma Prototype:**
- Initial: Y offset +100%, Opacity 0%
- Final: Y offset 0, Opacity 100%
- Duration: 500ms
- Easing: Custom Bezier (0.25, 0.46, 0.45, 0.94)

### 4. Shimmer Hover Effect

**CSS Implementation:**
```
.shimmer::after {
  content: '';
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: linear-gradient(
    110deg,
    transparent 40%,
    rgba(255,255,255,0.1) 50%,
    transparent 60%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: -100% 0 }
  100% { background-position: 100% 0 }
}
```

**Figma:**
- Create overlay rectangle
- Gradient: Transparent → White 10% → Transparent
- Animate position: X -100% → X 100%
- Duration: 1500ms
- Loop: Infinite
- Trigger: While Hovering

### 5. Float Animation (Orbs)

**Keyframes:**
```
@keyframes float {
  0% { transform: translate(0, 0) }
  50% { transform: translate(10px, 15px) }
  100% { transform: translate(0, 0) }
}

Properties:
├── Duration: 12s
├── Timing: ease-in-out
└── Iteration: infinite
```

**Figma:**
- Frame 1: X 0, Y 0
- Frame 2 (6000ms): X +10, Y +15
- Frame 3 (12000ms): X 0, Y 0
- Easing: Ease In and Out
- Loop

---

## 🎨 THEME VARIATIONS

### Theme Switcher Setup in Figma

Create 9 Color Style Sets:

#### 1. Charnoks Classic
```
Already defined above (default)
```

#### 2. Ocean Theme
```
Background Start: #141E30
Background End: #243B55
Primary: #3B82F6
Secondary: #0EA5E9
Accent: #22D3EE
```

#### 3. Forest Theme
```
Background Start: #101A16
Background End: #2A4437
Primary: #22C55E
Secondary: #16A34A
Accent: #86EFAC
```

#### 4. Sunset Theme
```
Background Start: #4C1D95
Background End: #9333EA
Primary: #A855F7
Secondary: #C084FC
Accent: #E9D5FF
```

#### 5. Light Mode
```
Background Start: #F3F4F6
Background End: #E5E7EB
Primary: #2563EB
Secondary: #1D4ED8
Accent: #60A5FA
Text Primary: #1D4ED8
Text Secondary: #374151
Card BG: #FFFFFF with 80% opacity
```

#### 6. Gray Theme
```
Background Start: #111827
Background End: #374151
Primary: #6B7280
Secondary: #9CA3AF
Accent: #D1D5DB
```

#### 7. Ruby Theme
```
Background Start: #9F1C34
Background End: #DC2626
Primary: #F43F5E
Secondary: #FB7185
Accent: #FDA4AF
```

#### 8. Cosmic Theme
```
Background Start: #1C192F
Background End: #43386F
Primary: #A78BFA
Secondary: #C4B5FD
Accent: #818CF8
```

#### 9. Golden Theme
```
Background Start: #EA580C
Background End: #FB923C
Primary: #FBCB24
Secondary: #FCD34D
Accent: #FDE68A
```

**Figma Implementation:**
1. Create a component set for each theme
2. Use variables/styles that reference theme colors
3. Create a theme switcher prototype with component swap

---

## 💻 IMPLEMENTATION NOTES

### Figma to Code Translation

#### 1. Auto Layout → Flexbox/Grid
```
Figma Auto Layout = CSS Flexbox

Auto Layout Vertical = flex-direction: column
Auto Layout Horizontal = flex-direction: row
Gap = gap property
Hug Contents = width/height: auto
Fill Container = flex: 1
```

#### 2. Component Variants → React Props
```
Figma Variant Properties = React Component Props

Button/Size=Large = <Button size="large" />
Button/State=Hover = CSS :hover pseudo-class
Button/Disabled=True = <Button disabled={true} />
```

#### 3. Effects → CSS
```
Drop Shadow = box-shadow
Backdrop Blur = backdrop-filter: blur()
Layer Blur = filter: blur()
Inner Shadow = box-shadow inset
```

### Developer Handoff Checklist

#### Essential Exports:
- [ ] All components as SVG/PNG (icons, logos)
- [ ] Color styles as CSS variables
- [ ] Text styles as CSS classes
- [ ] Spacing tokens as CSS variables
- [ ] Component specifications document
- [ ] Interaction/animation specifications
- [ ] Responsive breakpoint documentation
- [ ] Figma Dev Mode enabled for inspect

#### Code Generation:
```
Figma Dev Mode provides:
├── CSS for any selected element
├── React/Vue/Swift code suggestions
├── Exact spacing and sizing
├── Color values in any format
└── Export assets in any resolution
```

### Best Practices

#### 1. Naming Conventions
```
Components: PascalCase (Button, KPICard)
Variants: kebab-case (size-large, state-hover)
Layers: Descriptive (icon-container, price-label)
Pages: UPPER_CASE (LOGIN_PAGE, DASHBOARD)
```

#### 2. Component Organization
```
Figma Structure:
📁 Design System
  ├── 🎨 Colors
  ├── 📝 Typography  
  ├── 🔲 Icons
  ├── 🧩 Components
  │   ├── Buttons
  │   ├── Cards
  │   ├── Forms
  │   ├── Navigation
  │   └── Overlays
  └── 📱 Templates
      ├── Login
      ├── Dashboard
      ├── Products
      └── Sales
```

#### 3. Responsive Design in Figma
```
Create 3 frames for each page:
├── 📱 Mobile (375px)
├── 💻 Tablet (768px)
└── 🖥️ Desktop (1440px)

Use Constraints and Auto Layout for fluid scaling
```

---

## 📦 EXPORT SPECIFICATIONS

### Asset Export Settings

#### Icons & Logos
```
Format: SVG (preferred) or PNG @2x, @3x
Size: Original size
Naming: icon-name.svg / logo-name.svg
Optimize: Remove unnecessary data
```

#### Component Screenshots
```
Format: PNG @2x
Background: Transparent or with gradient
Size: Component actual size
Naming: component-name-variant.png
```

#### Mockups for Presentation
```
Format: PNG @2x or JPG
Size: 1920px width (desktop), 750px (mobile)
Background: Include gradient/theme
Naming: page-name-device.png
```

### Figma Plugin Recommendations

#### For Design:
- **Unsplash**: Stock photos for product images
- **Stark**: Accessibility contrast checking
- **Autoflow**: Draw user flows
- **Content Reel**: Generate realistic data

#### For Development:
- **Figma to Code**: HTML/CSS generation
- **Anima**: Export to React/Vue
- **zeroheight**: Generate documentation
- **Stark**: Color contrast audit

---

## 🚀 QUICK START GUIDE FOR DESIGNERS

### Step 1: Initial Setup (30 min)
1. Create new Figma file
2. Import Poppins font
3. Set up color styles (9 themes)
4. Create text styles
5. Define spacing variables

### Step 2: Build Components (2-3 hours)
1. Start with atoms (buttons, inputs)
2. Build molecules (cards, form groups)
3. Create organisms (header, sidebar)
4. Assemble templates (page layouts)

### Step 3: Design Pages (1-2 hours per page)
1. Use templates as starting point
2. Populate with real content
3. Add interactions and animations
4. Create responsive variants

### Step 4: Prototype & Handoff (1 hour)
1. Link pages with Smart Animate
2. Add interaction triggers
3. Enable Dev Mode
4. Export assets
5. Share with developers

---

## 📋 COMPONENT CHECKLIST

### Buttons ✓
- [x] Primary Button (3 sizes, 5 states)
- [x] Secondary Button
- [x] Icon Button
- [x] Navigation Button

### Cards ✓
- [x] KPI Card
- [x] Product Card
- [x] Modern Card (container)
- [x] Chart Card

### Forms ✓
- [x] Text Input
- [x] Input with Icon
- [x] Password Input (with toggle)
- [x] File Upload (drag & drop)
- [x] Checkbox
- [x] Number Pad

### Navigation ✓
- [x] Desktop Sidebar
- [x] Mobile Header
- [x] Mobile Sidebar Overlay
- [x] Navigation Items

### Modals ✓
- [x] Number Pad Modal
- [x] Confirmation Modal
- [x] Success Overlay
- [x] Loading Spinner

### Pages ✓
- [x] Login Page
- [x] Owner Dashboard
- [x] Products Page
- [x] Worker Dashboard
- [x] Sales Page

---

## 🎯 FINAL NOTES

### For Figma Import:
1. **Use the JSON file** (`CHARNOKS_COMPLETE_DESIGN_SPEC.json`) as your single source of truth
2. **Reference this guide** for detailed component specifications
3. **Create component variants** for all states (hover, active, disabled)
4. **Use Auto Layout** everywhere for flexibility
5. **Apply consistent naming** for easy developer handoff

### Key Measurements Summary:
- **Sidebar Width**: 256px
- **Mobile Header Height**: 64px
- **KPI Card**: 280px x 140px (flexible)
- **Product Card**: 240px x 300px
- **Button Height**: 40px (sm), 48px (md), 56px (lg)
- **Input Height**: 48px
- **Border Radius**: 8px (inputs), 12-24px (cards)
- **Spacing Scale**: 4px, 8px, 16px, 24px, 32px, 48px, 64px

### Animation Durations:
- **Micro-interactions**: 200-300ms
- **Component transitions**: 300-500ms
- **Page transitions**: 500ms
- **Background gradient**: 15s loop
- **Hover effects**: 150-300ms

---

**Document Version**: 1.0  
**Last Updated**: 2025  
**Author**: Charnoks Design System  
**Format**: Figma Implementation Guide
