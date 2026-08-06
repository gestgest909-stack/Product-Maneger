# Distributor UI/UX Enhancement — Implementation Plan

Phase 1 DONE. Phases 2-4 pending. Build verified.

---

## Phase 1: Visual & Interaction Polish — DONE

### 1.1 Price Input Group Redesign — DONE
- **Problem:** Two separate fields + save button feel disconnected
- **Solution:** Unified "price card" with clear visual grouping
  - Card container with subtle border/radius
  - Inline labels → floating labels on focus
  - Show calculated margin % (selling - cost) / cost inline
  - Color-code inputs: cost=neutral, selling=primary tint
  - **Mobile:** Stack vertically with full-width inputs, 48px min-height

### 1.2 Row States & Visual Feedback — DONE
- **Dirty state** (current: border + gradient) → enhanced:
  - Subtle pulse animation on first edit
  - Inline "unsaved" badge near save button
  - Auto-save indicator (spinner in button) per row
- **Saved state** → brief success flash (green border pulse)
- **Error state** → inline error text under field, shake animation

### 1.3 Image Optimization for Mobile — DONE
- **Current:** 16:10 aspect ratio, full card width
- **Proposed:**
  - Thumbnail mode: 80x80px square on left, content on right (like admin mobile)
  - Tap to expand → full-screen modal with zoom
  - Lazy load with blur placeholder (LQIP)

### 1.4 Tab Bar Enhancement — DONE
- **Current:** Horizontal scroll, min-width tabs
- **Proposed:**
  - **Desktop:** Centered, equal width, icon+label
  - **Mobile:** Fixed 3-tab layout (no scroll), larger hit targets (56px), active indicator bar
  - Badge animation: pulse only on first mount, then static

### Files Modified
- `src/components/GuestRow.jsx` (NEW) — Extracted row component with enhanced UX
- `src/components/GuestGrid.jsx` — Updated to use new GuestRow
- `src/styles.css` — Added 400+ lines of new styles

### Features Implemented
- Unified "price card" with grouped cost/selling fields
- Color-coded inputs (cost=neutral, selling=primary)
- Dirty indicator (pulsing dot) per field
- Real-time margin calculator with profit value
- Row states: dirty, saving, saved, error
- Swipe animation: shake on error, flash on saved
- Save button: spinner during save, pulse when changes pending
- Mobile thumbnail layout (80px square)
- Corner availability pill (absolute positioned)
- Swipe actions infrastructure (left/right)
- Enhanced empty states with floating icons
- Mobile tab bar (fixed 3-column, 56px targets)
- Accessibility: aria-live regions, proper labels

---

## Phase 2: Mobile-First UX Patterns — PENDING

### 2.1 Swipe Actions per Row — PENDING
```
← Swipe Left →          → Swipe Right →
[Save] [Duplicate]      [Hide] [Request]
```
- **Left swipe:** Primary actions (Save, Duplicate prices from similar product)
- **Right swipe:** Secondary (Hide from catalog, Request restock)
- Haptic feedback on threshold cross
- Auto-close other open rows
- **Status:** Infrastructure added (CSS + touch handlers), actions need wiring

### 2.2 Pull-to-Refresh — PENDING
- Native feel on mobile browser
- Refreshes all 3 tabs data (products, requests, orders)
- Skeleton loaders during fetch
- Implementation: Custom hook `usePullToRefresh`

### 2.3 Bottom Sheet for "Save All" (Mobile) — PENDING
- **Current:** Fixed bar at bottom
- **Proposed:** Bottom sheet slides up on "Save All" tap
  - Shows summary: "X products with changes"
  - List of changed products with before/after prices
  - Confirm button at bottom
  - Dismiss on backdrop tap or swipe down
- **Implementation:** New `BulkActionsSheet` component

### 2.4 Quick Price Entry Mode — PENDING
- **Toggle:** "Quick Entry" switch in header
- **Behavior:**
  - Tap cost field → auto-focus selling → auto-save → next product
  - Keyboard: `inputmode="decimal"` + `enterkeyhint="next"`
  - Tab key navigation between fields
  - "Fill down" / "Copy previous" buttons

---

## Phase 3: Distributor-Specific Features — PENDING

### 3.1 Price History & Comparison — PENDING
- **Per product:** Show last 3 price entries (date, cost, selling, margin)
- **Visual:** Small sparkline or dot chart in row expand
- **Context:** "Last updated by you on DD/MM"
- **Backend:** New `price_history` table or JSON column on products

### 3.2 Bulk Actions Toolbar (Mobile) — PENDING
- **Trigger:** Long-press or multi-select mode toggle
- **Actions:**
  - Apply same margin % to selected
  - Round prices to nearest .00 / .50 / .99
  - Export selected to CSV
  - Mark as "reviewed"

### 3.3 Smart Suggestions — PENDING
- **Margin presets:** 15%, 20%, 25%, 30% chips above selling price
- **Cost-based:** If cost entered, suggest selling = cost × (1 + avg_margin)
- **Category defaults:** Remember last margin per category
- **Implementation:** Chips in price-input-group, onClick fills selling field

### 3.4 Offline-First / Optimistic UI — PENDING
- LocalStorage cache of products + pending changes
- Immediate visual update, background sync
- Conflict resolution toast if server rejects
- "Pending sync" indicator in header
- **Implementation:** Custom hook `useOfflineSync`

---

## Phase 4: Accessibility & Polish — PENDING

### 4.1 Accessibility Audit — PENDING
| Item | Implementation |
|------|----------------|
| **Focus management** | Trap focus in bottom sheets, restore on close |
| **Live regions** | `aria-live="polite"` for save confirmations |
| **Keyboard nav** | Arrow keys between tabs, Enter to activate |
| **Screen readers** | Proper labels for price inputs, status pills |
| **Reduced motion** | Respect `prefers-reduced-motion` |
| **High contrast** | Ensure 4.5:1 ratios, test with Windows HC mode |

### 4.2 Performance Optimizations — PENDING
- Virtualize long product lists (react-virtual or similar)
- Image lazy loading with Intersection Observer
- Debounce search input
- Memoize expensive computations

### 4.3 Cross-Browser Testing — PENDING
- iOS Safari (swipe gestures, input modes)
- Android Chrome (haptics, scroll behavior)
- Desktop browsers (keyboard nav, focus management)

---

## CSS Architecture Changes

### New Utility Classes (Added in Phase 1)
```css
/* Price input group */
.price-input-group { }
.price-input-group__field { }
.price-input-group__margin { }

/* Row states */
.guest-row--dirty { }
.guest-row--saving { }
.guest-row--saved { }
.guest-row--error { }

/* Swipe actions */
.swipe-actions { }
.swipe-actions__left { }
.swipe-actions__right { }

/* Bottom sheet */
.bottom-sheet { }
.bottom-sheet__handle { }
.bottom-sheet__content { }

/* Skeleton loaders */
.skeleton { }
.skeleton--card { }
.skeleton--image { }
```

### Breakpoint Strategy
| Breakpoint | Layout |
|------------|--------|
| ≥ 1024px | 2-col grid, side-by-side price fields |
| 720–1023px | 1-col cards, 2 price fields inline |
| 480–719px | Stacked cards, thumbnail left, full-width fields |
| < 480px | Compact mode, bottom sheet for bulk actions |

---

## Component Refactor Map

| Current | New / Enhanced |
|---------|----------------|
| `GuestRow` (inline) | `GuestRow.jsx` (separate file with enhanced UX) — DONE |
| `GuestGrid` | `DistributorDashboard` (orchestrates tabs, state, bulk actions) — PENDING |
| `GuestTabs` | `TabBar` (reusable, mobile-optimized) — PENDING |
| `RequestedProducts` / `CurrentOrders` | Unify into `RequestList` + `OrderList` with shared `ActionCard` — PENDING |
| `saveAll` bar | `BulkActionsSheet` (bottom sheet component) — PENDING |

---

## Implementation Priority

| Priority | Tasks | Status | Est. Effort |
|----------|-------|--------|-------------|
| **P0** | Price input group redesign, row state animations, mobile thumbnail layout | DONE | 2-3 days |
| **P1** | Swipe actions, bottom sheet for Save All, pull-to-refresh | INFRASTRUCTURE DONE, ACTIONS PENDING | 3-4 days |
| **P2** | Quick entry mode, margin presets, price history | PENDING | 2-3 days |
| **P3** | Offline cache, bulk actions toolbar, accessibility audit | PENDING | 2-3 days |

---

## Build Verification

- ✓ 91 modules transformed
- ✓ Built in 292ms
- ✓ No errors
- ⚠ Chunk size warning (504KB) — acceptable for now

---

## Notes

- Phase 1 CSS appended to end of `styles.css` to avoid duplicate section conflicts
- Swipe action touch handlers added but button clicks need wiring to actual actions
- Margin calculator shows on field focus, hides on blur (with 200ms delay)
- Availability pill moved to corner of image (absolute positioned)
- Duplicate CSS sections exist in styles.css (lines 2245-2542 vs 2667-2943) — should be cleaned up in future pass
