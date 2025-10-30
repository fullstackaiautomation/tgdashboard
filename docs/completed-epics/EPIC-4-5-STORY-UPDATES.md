# Epic 4 & 5 Story Updates Summary

**Date**: October 14, 2025
**Updated By**: John (Product Manager)
**Reason**: Architecture alignment - changed from "business vs. life" separation to unified 7-area tracking

---

## **ARCHITECTURE DECISIONS**

### **7 Life Areas** (Replaces "businesses" and "life areas" terminology):
1. Full Stack
2. S4
3. 808
4. Personal (formerly "Life")
5. Huge Capital
6. Golf
7. Health

### **Key Changes**:
- "Business" → "Area" (when referring to time tracking)
- "Life areas" → Part of the same 7 areas (not separate)
- "5 businesses" → "7 areas"
- "Service SaaS" → Removed (doesn't exist)
- "Content" → Content Library (module, not an area)
- "Life" → "Personal" (area name)

---

## **EPIC 4: TIME ALLOCATION & ANALYTICS**

### **Epic-Level Changes**:
✅ **COMPLETED**: Epic PRD updated with:
- Area-based terminology throughout
- Note about creating NEW `/analytics` page (not modifying existing pages)
- 7 areas explicitly listed

### **Story-by-Story Updates Needed**:

#### **Story 4.1: Deep Work Time Allocation Calculation** ✅ **MINIMAL CHANGES**
**File**: `docs/stories/4.1.deep-work-time-allocation-calculation.md`

**Changes**:
- User story: "multi-business operator" → "someone managing multiple life areas"
- User story: "per business and life area" → "per area"
- AC1: Clarify 7 areas explicitly
- AC2: "business area" → "area"
- AC4: Remove (already covered by "7 areas tracked equally")
- AC6: "by business" → "by area"

**Status**: Story mostly correct as-is, minor terminology cleanup

---

#### **Story 4.2: Business-Level Time Investment Dashboard** ⚠️ **MAJOR REWRITE**
**Current File**: `docs/stories/4.2.business-time-investment-dashboard.md`
**New Title**: "Area-Level Time Investment Analytics (New Page)"

**Major Changes**:
1. **Title**: "Business-Level" → "Area-Level Time Investment Analytics (New Page)"
2. **User Story**:
   - Old: "consultant balancing 3 clients plus 2 personal ventures"
   - New: "someone balancing 7 life areas"
   - Old: "each Business page"
   - New: "dedicated analytics page"
3. **AC1**: "Each Business page" → "NEW page at `/analytics` route"
4. **AC2-8**: Replace "business" with "area" throughout
5. **AC5**: "all 5 businesses" → "all 7 areas"
6. **AC9**: ADD: "This is a NEW page - existing Business Projects page is NOT modified"
7. **All Tasks**: Update queries to use `area` field from tasks (via Deep Work sessions)
8. **Remove**: Revenue tracking (AC3) - not applicable to all areas
9. **Component names**: `BusinessTimeStats` → `AreaTimeStats`, etc.

**Critical Note**: This story creates a NEW page, does NOT modify existing Business Projects page

---

#### **Story 4.3: Health Goal Time Monitoring** ✅ **MINOR CHANGES**
**File**: `docs/stories/4.3.health-goal-time-monitoring.md`

**Changes**:
- Clarify "Health area" is one of 7 areas (not separate concept)
- AC2: Specify shown on "Time Analytics page and Review dashboard"
- AC9: "Daily Schedule" (existing feature) not new page

**Status**: Mostly correct, just clarification needed

---

#### **Story 4.4: Time Allocation Visual Analytics** ⚠️ **MODERATE CHANGES**
**File**: `docs/stories/4.4.time-allocation-visual-analytics.md`

**Changes**:
1. AC1: "Analytics dashboard" → part of `/analytics` page from Story 4.2
2. AC2: "hours per business per day" → "hours per area per day"
3. AC3: "Business distribution" → "Area distribution" (7 areas, not 5)
4. AC4: Remove (all 7 areas already in AC3)
5. AC5: "businesses" → "areas"
6. AC9: "activity types" stays same (labels work across areas)
7. AC10: "time allocation" → "area allocation"

**Status**: Terminology cleanup, clarify this is part of Analytics page

---

#### **Story 4.5: Time Allocation Targets & Planning** ⚠️ **MODERATE CHANGES**
**File**: `docs/stories/4.5.time-allocation-targets-planning.md`

**Changes**:
1. AC1: Update list to 7 areas (remove "Service SaaS"):
   - "Full Stack: 10h, S4: 6h, 808: 4h, Personal: 5h, Huge Capital: 8h, Golf: 2h, Health: 5h"
2. AC2: Remove (life areas are part of AC1's 7 areas)
3. AC3-9: "business" → "area" throughout
4. AC6: "Huge Capital" example stays (is one of 7 areas)

**Status**: List update + terminology cleanup

---

#### **Story 4.6: Deep Work Session Insights** ✅ **MINIMAL CHANGES**
**File**: `docs/stories/4.6.deep-work-session-insights-optimization.md`

**Changes**:
- AC2: "businesses/projects" → "areas/projects"
- AC7: "Business context switching" → "Area context switching"
- AC7: "switching between businesses" → "switching between areas"
- AC8: "Full Stack AI" example stays (is an area)

**Status**: Just terminology cleanup

---

## **EPIC 5: REVIEW DASHBOARD & AGGREGATED VIEWS**

### **Epic-Level Changes Needed**:
**File**: `docs/prd/epic-5-review-dashboard-aggregated-views.md`

**Major Changes**:
1. Epic Goal: "7 main areas" → "main modules plus Health area focus"
2. Update structure description:
   - OLD: DAILY, BIZNESS, CONTENT, HEALTH, FINANCES, LIFE, GOLF
   - NEW: Daily, Business Projects, Tasks Hub, Content Library, Finances, Health Focus
3. Clarify: Module-based cards (not area-based)

---

### **Story-by-Story Updates Needed**:

#### **Story 5.1: Review Dashboard Page Structure** ⚠️ **MAJOR REWRITE**
**File**: `docs/stories/5.1.review-dashboard-page-structure.md`

**Major Changes**:
1. **User Story**: "7 main areas" → "all main modules"
2. **AC1**: Replace list:
   - OLD: DAILY, BIZNESS, CONTENT, HEALTH, FINANCES, LIFE, GOLF (7 cards)
   - NEW: Daily, Business Projects, Tasks Hub, Content Library, Finances, Health Focus (6 cards)
3. **AC2**: Update card descriptions to match modules
4. **AC7**: "areas with urgent items" → "modules with urgent items"

**Layout**:
```
┌─────────────────────────────────────┐
│  Intelligence & Alerts (Top)        │
├───────────┬───────────┬─────────────┤
│  Daily    │  Business │  Tasks Hub  │
│  Card     │  Projects │  Card       │
├───────────┼───────────┼─────────────┤
│  Content  │  Finances │  Health     │
│  Library  │  Card     │  Focus Card │
└───────────┴───────────┴─────────────┘
```

---

#### **Story 5.2: Daily Area Summary Card** ✅ **MINOR CHANGES**
**File**: `docs/stories/5.2.daily-area-summary-card.md`

**Changes**:
1. **Title**: "Daily Area Summary Card" → "Daily Card"
2. Clarify: Shows data from Daily tab (not an "area")
3. All ACs stay mostly same (already correct)

---

#### **Story 5.3: Business Area Summary Card** ⚠️ **MAJOR REWRITE**
**File**: `docs/stories/5.3.business-area-summary-card.md`

**Current Title**: "Business Area Summary Card"
**New Title**: "Business Projects Card"

**Major Changes**:
1. **User Story**: "managing 5 businesses" → "managing multiple business projects"
2. **Goal**: Show data from existing Business Projects module (not create new structure)
3. **AC1**: "aggregate across all 5 businesses" → "aggregate across all projects"
4. **AC2**: Focus on project-level metrics (completion %, active tasks, phases)
5. **AC2**: Show which projects need attention (stalled, overdue, zero progress)
6. **AC3**: Remove business-specific alerts, use project-level alerts
7. **AC4**: Click card → navigate to Business Projects page
8. **AC5**: Remove "business mini-cards" (this is module card, not area breakdown)
9. **AC6**: "Next deadline" from any project

**Note**: This card aggregates existing Business Projects data, doesn't modify that page

---

#### **Story 5.4: Health, Content, Life, Golf Summary Cards** ⚠️ **MAJOR REWRITE**
**File**: `docs/stories/5.4.health-content-life-golf-summary-cards.md`

**Current**: 4 separate cards (Health, Content, Life, Golf)
**New**: 2 cards (Health Focus, Content Library)

**Changes**:
1. **Title**: "Health Focus & Content Library Cards"
2. **Remove**: "Life" card (Personal area tracked via Tasks Hub filters)
3. **Remove**: "Golf" card (Golf area tracked via Tasks Hub filters)
4. **Keep**: Health card (special visibility for wellness)
5. **Keep**: Content card (shows Content Library module)
6. **Health Card ACs**: Stay mostly same (shows Health area time tracking from Epic 4)
7. **Content Card ACs**: Stay same (shows Content Library module data)

**Rationale**: Health deserves special card (wellness priority), Content is a module, Personal/Golf are just areas (use Tasks Hub)

---

#### **Story 5.5: Finances Area Summary Card** ✅ **MINOR CHANGES**
**File**: `docs/stories/5.5.finances-area-summary-card.md`

**Changes**:
1. **Title**: "Finances Area Summary Card" → "Finances Card"
2. Remove "area" from title (Finances is a module, not an area)
3. All ACs stay same (already correct)

---

#### **Story 5.6: Review Dashboard Intelligence & Alerts** ✅ **MINOR CHANGES**
**File**: `docs/stories/5.6.review-dashboard-intelligence-alerts.md`

**Changes**:
1. AC2: "Businesses with zero hours" → "Areas with zero hours"
2. AC5: "Alert me if any business gets <2h" → "Alert me if any area gets <2h"
3. AC9: Remove (customization is post-MVP)

---

## **IMPLEMENTATION PRIORITY**

### **Phase 1: Update All Story Files** (This task)
- [ ] Epic 4 PRD ✅ DONE
- [ ] Story 4.1 (minimal)
- [ ] Story 4.2 (major - new page)
- [ ] Story 4.3 (minor)
- [ ] Story 4.4 (moderate)
- [ ] Story 4.5 (moderate)
- [ ] Story 4.6 (minimal)
- [ ] Epic 5 PRD
- [ ] Story 5.1 (major - module structure)
- [ ] Story 5.2 (minor)
- [ ] Story 5.3 (major - projects focus)
- [ ] Story 5.4 (major - reduce to 2 cards)
- [ ] Story 5.5 (minor)
- [ ] Story 5.6 (minor)

### **Phase 2: Hand Off to Development**
Once all story files updated, SM agent can create stories for dev implementation.

---

## **KEY REMINDERS FOR UPDATES**

1. **Don't Modify Existing Pages**: Epic 4.2 creates NEW `/analytics` page
2. **Module vs Area**: Review dashboard shows modules (Daily, Business Projects, etc.), not areas
3. **7 Areas**: Full Stack, S4, 808, Personal, Huge Capital, Golf, Health
4. **Personal = Life**: Terminology change
5. **No Service SaaS**: Remove all references (doesn't exist)
6. **Content = Module**: Content Library is a feature, not an area

---

**Status**: Epic 4 PRD updated ✅
**Next**: Update remaining 11 story files (4.1-4.6, 5.1-5.6)
