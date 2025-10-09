# Content Library Enhancement PRD

## 1. Intro Project Analysis and Context

### 1.1 Existing Project Overview

**Analysis Source**: IDE-based fresh analysis

**Current Project State**:
TG Dashboard is a **personal productivity and business management application** built with React 19, TypeScript, Vite, and Supabase. It provides a unified interface to manage daily tasks, business projects across multiple ventures, and personal goals. The Content Library feature already exists as a foundational implementation that allows users to save and categorize online content (videos, articles, social media posts) with basic metadata.

**Primary tech stack**:
- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: TailwindCSS
- **Backend/Database**: Supabase (PostgreSQL + Auth)
- **State Management**: React Query (@tanstack/react-query)
- **Icons**: Lucide React

### 1.2 Available Documentation Analysis

✓ Tech Stack Documentation (via package.json analysis)
✓ Source Tree/Architecture (component analysis complete)
✓ API Documentation (Supabase schema discovered)
✓ Existing Content Library implementation found at [src/components/ContentLibrary.tsx](src/components/ContentLibrary.tsx)
✗ Coding Standards (not formalized)
✗ UX/UI Guidelines (inferred from existing components)

### 1.3 Enhancement Scope Definition

**Enhancement Type**:
- ✓ **New Feature Addition** (AI-powered link analysis, business tagging, value ratings)
- ✓ **Major Feature Modification** (Enhanced UI/UX, improved data model)

**Enhancement Description**:
Enhance the existing Content Library with AI-powered content analysis, dashboard area context tagging, advanced filtering, and a refined Pinterest-style visual experience to make it a comprehensive knowledge management system for saving and organizing online learning resources.

**Impact Assessment**:
- ✓ **Moderate Impact** (enhancements to existing component, database schema modifications, new AI integration)

### 1.4 Goals and Background Context

**Goals**:
- Enable one-click content saving with AI-powered auto-fill of metadata (title, summary, thumbnail)
- Connect content to dashboard areas (businesses + life domains) for contextual organization
- Implement value rating system (1-10) to track content quality post-review
- Create Pinterest-style masonry grid layout for visual browsing
- Improve search and filtering with multi-select dashboard area tags and advanced criteria

**Background Context**:

The Content Library exists as a basic implementation but lacks the sophistication needed for rapid content curation. Currently, users must manually enter all metadata when saving content, which is time-consuming and reduces usage. By adding AI-powered link analysis, the system can auto-populate card details from URLs, making it effortless to save content on-the-go.

Additionally, connecting content to the existing business entities (Full Stack AI, Huge Capital, S4, 808, Service SaaS) plus life areas (Health, Life, Finance, Golf) provides crucial context for organizing learning resources by their application area. The value rating system (1-10) helps prioritize which saved content is worth revisiting or implementing.

### 1.5 Change Log

| Change | Date | Version | Description | Author |
|--------|------|---------|-------------|--------|
| Initial Draft | 2025-10-08 | 0.1 | Content Library Enhancement PRD creation | John (PM Agent) |

---

## 2. Requirements

### 2.1 Functional Requirements

**FR1**: The system shall provide a "Quick Add by URL" feature that accepts a URL and uses AI analysis to automatically generate a text summary, extract title, thumbnail image, creator/author, estimated time to consume, and auto-populate all applicable form fields.

**FR2**: AI-generated summary shall be displayed in a dedicated text box field that is editable and persistent with the content item.

**FR3**: The Content Library shall allow users to tag content items with one or more dashboard areas using multi-select: Businesses (Full Stack AI, Huge Capital, S4, 808, Service SaaS), Health, Life, Finance, and Golf.

**FR4**: The system shall support a value rating field (1-10 scale) that users can set after reviewing content to indicate its quality and usefulness.

**FR5**: The Content Library shall display content items in a responsive Pinterest-style masonry grid layout with card-based UI showing thumbnail, title, AI-generated summary snippet, source icon, status badges, and quick actions.

**FR6**: The system shall provide advanced filtering capabilities including: search by title/summary/tags, filter by source platform, category, status, priority, dashboard area tags, favorites, and value rating ranges.

**FR7**: Users shall be able to upload images directly (via file picker, drag-and-drop, or paste) for content thumbnails when AI cannot extract an image or user wants to override.

**FR8**: The system shall support organizing content into folders for additional hierarchical organization beyond tags and categories.

**FR9**: Each content item shall support both AI-generated summary and user notes fields - summary auto-filled by AI, notes for personal insights.

**FR10**: The Content Library shall maintain existing functionality for manual content creation when users don't have a URL or prefer manual entry.

**FR11**: The system shall provide quick status updates (To Watch → In Progress → Completed → Implementing → Archived → Vault) with one-click status changes from the card view.

**FR12**: Content items shall display the source platform with distinctive icons (𝕏 for Twitter, ▶ for YouTube, 📷 for Instagram, etc.) for quick visual identification.

**FR13**: The system shall allow users to mark content as favorites with a star icon, with favorites filterable in the search interface.

### 2.2 Non-Functional Requirements

**NFR1**: AI content analysis shall complete within 10 seconds for 95% of requests to maintain responsive user experience during quick content saving.

**NFR2**: The Pinterest-style grid layout shall be responsive and perform smoothly with up to 500 content items loaded, using virtualization if necessary for larger collections.

**NFR3**: The enhancement shall maintain the existing dark theme UI aesthetic (gray-800 backgrounds, colored accents) consistent with the current TG Dashboard design system.

**NFR4**: All AI-generated content metadata (summary, title, thumbnail) shall be editable by the user to allow corrections and refinements before saving.

**NFR5**: The system shall handle AI service failures gracefully, falling back to manual entry mode with clear error messaging when AI analysis is unavailable.

**NFR6**: Image thumbnails shall be optimized for web display (max 800px width) and stored efficiently in Supabase Storage to minimize costs.

**NFR7**: The enhanced Content Library shall maintain current Supabase RLS (Row Level Security) policies ensuring users can only access their own content.

**NFR8**: Search and filter operations shall execute in under 500ms for collections up to 1000 items.

### 2.3 Compatibility Requirements

**CR1**: Database schema modifications must add new fields (ai_summary, dashboard_areas array, value_rating) while maintaining backward compatibility with existing content_library data.

**CR2**: The dashboard_areas field shall support tagging with: business IDs (linking to businesses table), plus literal values for "Health", "Life", "Finance", and "Golf".

**CR3**: The enhanced component shall maintain the existing navigation integration, remaining accessible via the main tab navigation without breaking existing routing.

**CR4**: All new filtering and sorting features shall preserve existing filter state management patterns using React hooks for consistency with the codebase.

**CR5**: The AI integration shall be implemented as an optional enhancement layer, allowing the system to function fully without AI services if needed (manual mode fallback).

---

## 3. User Interface Enhancement Goals

### 3.1 Integration with Existing UI

The enhanced Content Library will build upon the existing [ContentLibrary.tsx](src/components/ContentLibrary.tsx) component, maintaining its current dark theme aesthetic and card-based layout while introducing refinements for improved visual hierarchy and Pinterest-style browsing.

**Existing UI patterns to preserve:**
- Dark theme (bg-gray-800/900 backgrounds, gray-700 borders)
- Lucide React icon system
- Modal-based add/edit workflows
- Stats dashboard at top showing item counts by status
- Filter panel toggle pattern
- Supabase auth integration patterns

**New UI elements to integrate:**
- "Quick Add by URL" button alongside existing "Add Content" button
- AI Summary text box (read-only display in cards, editable in modals)
- Dashboard Areas multi-select chip selector
- Value rating input (1-10 slider or star rating component)
- Loading states during AI analysis with progress indicator

### 3.2 Modified/New Screens and Views

**Content Library Main View** (existing, enhanced):
- Add "Quick Add URL" button next to "Add Content" button in header
- Update card layout to display AI summary snippet (2-3 lines, truncated)
- Add dashboard area chips/badges below existing status/priority badges
- Include value rating display (stars or numeric) when set
- Maintain Pinterest-style masonry grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4)

**Quick Add Modal** (new):
- URL input field with paste support
- "Analyze with AI" button (or auto-analyze on paste)
- Loading spinner during AI processing
- Preview section showing AI-extracted data:
  - Title (editable)
  - AI Summary (editable text area, 3-4 lines)
  - Thumbnail preview (with option to replace)
  - Source, Creator, Time estimate (all editable)
- Dashboard Areas multi-select with chips
- Priority, Status, Tags, Folder fields
- Value Rating slider (optional, can be set later)
- "Save Content" and "Cancel" buttons

**Enhanced Add/Edit Content Modal** (existing, modified):
- Add AI Summary field (multi-line text area) above existing Notes field
- Replace single category dropdown with Dashboard Areas multi-select chip interface
- Add Value Rating input (1-10 scale with visual feedback)
- Maintain existing fields: Title, URL, Thumbnail, Source, Status, Priority, Creator, Tags, Folder, Notes, Favorite toggle

**Content Card** (existing, enhanced):
- Display AI summary snippet below title (line-clamp-2)
- Show dashboard area chips (color-coded by area type)
- Display value rating when set (e.g., "⭐ 8/10")
- Maintain existing: thumbnail, source icon, status/priority badges, favorite star, quick actions

**Details Modal** (existing, enhanced):
- Add dedicated AI Summary section with full text display
- Add Dashboard Areas section showing all tagged areas
- Add Value Rating display with visual representation
- Maintain existing: all metadata, notes section, action buttons

**Filters Panel** (existing, enhanced):
- Add "Dashboard Areas" filter section with checkboxes for:
  - Business entities (Full Stack AI, Huge Capital, S4, 808, Service SaaS)
  - Life areas (Health, Life, Finance, Golf)
- Add Value Rating range filter (e.g., "8+ rated content")
- Maintain existing filters: Source, Category, Status, Priority, Favorites

### 3.3 UI Consistency Requirements

**Visual Consistency:**
- Dashboard area chips shall use color coding: Business areas use business colors from seed data, Life areas use distinct palette (Health: green, Finance: blue, Life: purple, Golf: yellow)
- AI Summary text shall use gray-400 color for differentiation from user notes
- Value rating shall use yellow/gold accent color for star displays
- Loading states during AI analysis shall use blue-500 spinner matching existing loading patterns

**Interaction Consistency:**
- Dashboard area selection shall use the same multi-select chip pattern as existing tag input
- Quick Add modal shall follow the same modal styling and animation as existing Add Content modal
- AI-generated fields shall have a subtle indicator (e.g., small "AI" badge) when auto-filled but editable
- All form validations shall use existing error message styling (red-500 text, border highlights)

**Responsive Behavior:**
- Pinterest grid shall adapt: 1 column (mobile), 2 columns (tablet), 3 columns (desktop), 4 columns (large screens)
- Dashboard area chips shall wrap gracefully on smaller cards
- Quick Add modal shall be full-screen on mobile, centered dialog on desktop
- Filter panel shall collapse on mobile with slide-out drawer pattern

---

## 4. Technical Constraints and Integration Requirements

### 4.1 Existing Technology Stack

**Languages**: TypeScript 5.9, JavaScript (ES modules)

**Frameworks**:
- React 19.1.1 (with React DOM 19.1.1)
- Vite 7.1.7 (build tool and dev server)

**Database**:
- Supabase (PostgreSQL)
- @supabase/supabase-js 2.58.0

**Infrastructure**:
- GitHub Pages (static hosting)
- Supabase Cloud (backend/database/auth)

**External Dependencies**:
- @tanstack/react-query 5.90.2 (server state management)
- date-fns 4.1.0 (date utilities)
- lucide-react 0.544.0 (icon library)
- TailwindCSS 3.4.1 (styling)

**New Dependency Required**:
- AI Service API (options: OpenAI GPT-4o-mini, Anthropic Claude, or specialized web scraping API like Diffbot/Jina AI)

### 4.2 Integration Approach

**Database Integration Strategy**:

Database schema has been updated with the following columns:
- `ai_summary` TEXT - AI-generated content summary
- `dashboard_areas` TEXT[] - Array of business IDs + literal values (Health, Life, Finance, Golf)
- `value_rating` INTEGER (1-10 constraint)
- `source` TEXT - Platform type (Twitter, YouTube, Instagram, etc.)
- `thumbnail_url` TEXT - Image URL
- `creator` TEXT - Author/creator name
- `status` TEXT - Content status
- `priority` TEXT - Priority level
- `is_favorite` BOOLEAN - Favorite flag
- `folder` TEXT - Folder organization
- `saved_at` TIMESTAMPTZ - Save timestamp

**Indexes created:**
- GIN index on dashboard_areas for array filtering
- Index on value_rating for sorting/filtering

**API Integration Strategy**:

Create new API route/service layer for AI content analysis:
- **Recommended**: Supabase Edge Function (keeps API keys secure, serverless)
- **Alternative**: Client-side direct API calls (simpler but exposes rate limits)

Proposed AI service: **Jina AI Reader API** (free tier available) + **OpenAI GPT-4o-mini** for summary generation
- Jina AI Reader: Converts URLs to clean markdown (free, fast)
- GPT-4o-mini: Generates summary, extracts metadata (low cost ~$0.15/1M tokens)

**Frontend Integration Strategy**:

Extend existing ContentLibrary component:
- Create new `useAIAnalysis` custom hook for AI API calls
- Add QuickAddModal component alongside existing modals
- Update ContentItem type definition to include new fields
- Enhance filtering logic to support dashboard_areas array filtering
- Add dashboard_areas configuration (fetch businesses from `businesses` table + hardcoded life areas)

**Testing Integration Strategy**:
- Unit tests for AI parsing logic (mock API responses)
- Integration tests for database migrations
- Manual testing for AI accuracy across different URL types
- Error handling tests for AI service failures

### 4.3 Code Organization and Standards

**File Structure Approach**:
```
src/
  components/
    ContentLibrary.tsx (existing - enhance)
    content/
      QuickAddModal.tsx (new)
      ContentCard.tsx (new - extract from ContentLibrary)
      DashboardAreaSelector.tsx (new)
      ValueRatingInput.tsx (new)
  hooks/
    useAIAnalysis.ts (new)
    useContentLibrary.ts (new - extract business logic)
  types/
    content.ts (existing - extend)
  lib/
    ai-service.ts (new - AI API client)
supabase/
  migrations/
    add_content_library_enhancements.sql (new)
  functions/
    analyze-content/ (new Edge Function)
```

**Naming Conventions**:
- React components: PascalCase (QuickAddModal.tsx)
- Hooks: camelCase with 'use' prefix (useAIAnalysis.ts)
- Types: PascalCase (ContentItem, DashboardArea)
- Database columns: snake_case (ai_summary, dashboard_areas)

**Coding Standards**:
- TypeScript strict mode enabled
- Functional React components with hooks
- Async/await for API calls with error boundaries
- React Query for server state caching
- TailwindCSS for all styling (no CSS modules)

**Documentation Standards**:
- JSDoc comments for complex functions
- README update for AI service setup
- Migration notes for database schema changes

### 4.4 Deployment and Operations

**Build Process Integration**:
- No changes to existing Vite build process
- Environment variables for AI API keys (VITE_OPENAI_API_KEY, VITE_JINA_API_KEY)
- Supabase Edge Function deployment via CLI

**Deployment Strategy**:
- Database migrations already applied to production
- Frontend builds deploy to GitHub Pages (existing workflow)
- Edge Functions deploy separately to Supabase
- Feature flag for AI functionality (graceful degradation if disabled)

**Monitoring and Logging**:
- Log AI API response times and success rates to browser console (dev)
- Track AI API usage/costs via OpenAI dashboard
- Supabase logs for Edge Function errors
- Error tracking for failed AI analyses (fallback to manual entry)

**Configuration Management**:
- AI API keys stored in Supabase Edge Function secrets (not exposed client-side)
- Dashboard areas configuration pulled from `businesses` table + hardcoded life areas
- Feature flags via environment variables (VITE_ENABLE_AI_FEATURES)

### 4.5 Risk Assessment and Mitigation

**Technical Risks**:
- AI extraction accuracy varies by website (some sites block scrapers)
  - *Mitigation*: Fallback to manual entry, support multiple scraping services
- AI API costs could escalate with heavy usage
  - *Mitigation*: Use GPT-4o-mini (cheapest), implement rate limiting, cache results
- Thumbnail storage costs in Supabase
  - *Mitigation*: Compress images, use external URLs when possible, set storage limits

**Integration Risks**:
- Dashboard areas array filtering performance with large datasets
  - *Mitigation*: GIN index on array column, limit initial query results
- React Query cache invalidation complexity with new fields
  - *Mitigation*: Clear cache on schema changes, use query keys consistently

**Deployment Risks**:
- AI service outage breaks content saving
  - *Mitigation*: Graceful fallback to manual mode, retry logic with exponential backoff
- Environment variable misconfiguration in production
  - *Mitigation*: Validation on app startup, clear error messages for missing keys

**Mitigation Strategies**:
1. **Phased rollout**: Deploy AI features behind feature flag, enable for testing first
2. **Comprehensive error handling**: Every AI call wrapped in try/catch with user-friendly messages
3. **Performance monitoring**: Track AI response times, set timeout thresholds
4. **Cost controls**: Implement daily API call limits per user to prevent runaway costs
5. **Data validation**: Validate AI-generated data before saving to database

---

## 5. Epic and Story Structure

### 5.1 Epic Approach

**Epic Structure Decision**: Single comprehensive epic for Content Library Enhancement

**Rationale**: This enhancement is a cohesive feature set focused on one component (Content Library) with tightly coupled functionality. The AI-powered quick add, dashboard area tagging, value ratings, and UI improvements all work together to achieve the same goal: making content curation effortless and contextual.

---

## Epic 1: AI-Powered Content Library Enhancement

**Epic Goal**: Transform the Content Library into an effortless knowledge management system with AI-powered content analysis, dashboard area context tagging, and Pinterest-style visual browsing.

**Integration Requirements**:
- Maintain backward compatibility with existing content_library data
- Integrate with businesses table for business area tagging
- Preserve existing authentication and RLS policies
- Keep current component navigation structure intact

---

### Story 1.1: Dashboard Areas Multi-Select Component

**As a** TG Dashboard user,
**I want** to tag content with relevant dashboard areas (businesses + life areas),
**so that** I can organize content by where it applies in my life and business.

#### Acceptance Criteria

1. Create DashboardAreaSelector component that displays multi-select chips
2. Component fetches business entities from `businesses` table via Supabase
3. Component includes hardcoded life areas: Health, Life, Finance, Golf
4. Business chips display with their associated color from businesses table
5. Life area chips use distinct color palette (Health: green, Finance: blue, Life: purple, Golf: yellow)
6. Selected areas stored as array in content_library.dashboard_areas field
7. Component integrated into Add/Edit Content modals
8. Component allows adding/removing areas with visual feedback

#### Integration Verification

**IV1**: Verify existing content items without dashboard_areas still display correctly (null/empty array handling)
**IV2**: Confirm businesses table query uses existing Supabase client patterns and auth context
**IV3**: Test that saving content with dashboard_areas doesn't break existing filter/search functionality

---

### Story 1.2: Value Rating Input Component

**As a** content curator,
**I want** to rate content on a 1-10 scale after reviewing it,
**so that** I can prioritize high-value content for future reference and implementation.

#### Acceptance Criteria

1. Create ValueRatingInput component with 1-10 scale slider or star interface
2. Component displays current rating value numerically
3. Component allows clearing/unsetting rating (optional field)
4. Integration into Add/Edit Content modals
5. ContentCard displays rating badge when value_rating is set (e.g., "⭐ 8/10")
6. Details modal shows full rating with visual representation
7. Rating stored in content_library.value_rating field
8. Rating field is optional and can be added post-creation

#### Integration Verification

**IV1**: Existing content without ratings displays correctly without errors
**IV2**: Rating updates trigger proper React Query cache invalidation
**IV3**: Rating component follows existing form field styling patterns

---

### Story 1.3: Enhanced Content Card with AI Summary Display

**As a** user browsing my content library,
**I want** to see AI-generated summaries and dashboard area tags on content cards,
**so that** I can quickly identify relevant content without opening each item.

#### Acceptance Criteria

1. Extract ContentCard component from ContentLibrary.tsx for reusability
2. Add AI summary display (2-3 line truncation with line-clamp-2)
3. Display dashboard area chips below status/priority badges
4. Show value rating badge when present
5. Maintain existing: thumbnail, source icon, title, creator, status, priority, favorite star, quick actions
6. Card height adjusts dynamically based on content (supports masonry layout)
7. AI summary text styled in gray-400 for differentiation
8. Cards remain clickable to open details modal

#### Integration Verification

**IV1**: Existing cards without ai_summary display correctly (shows only notes/description)
**IV2**: Grid layout remains responsive across all breakpoints
**IV3**: Card click handlers and quick actions continue working as before

---

### Story 1.4: AI Content Analysis Service Layer

**As a** developer,
**I want** a reliable AI service layer for extracting content metadata from URLs,
**so that** the system can auto-populate content details accurately and efficiently.

#### Acceptance Criteria

1. Create Supabase Edge Function `analyze-content` for AI processing
2. Function accepts URL as input parameter
3. Function uses Jina AI Reader API to fetch clean content from URL
4. Function uses OpenAI GPT-4o-mini to generate:
   - Title (extract or generate)
   - AI summary (2-3 sentences)
   - Creator/author name
   - Estimated time to consume (in minutes)
   - Content source/platform detection
5. Function extracts thumbnail image URL (og:image, twitter:image, or first large image)
6. Function returns structured JSON with all extracted fields
7. Implement timeout (10 seconds max) and error handling
8. Function handles failures gracefully, returns partial data or error message
9. API keys stored securely in Supabase Edge Function secrets

#### Integration Verification

**IV1**: Edge Function deployment doesn't affect existing Supabase queries or auth
**IV2**: Function respects Supabase RLS - only processes requests for authenticated users
**IV3**: Error responses from Edge Function don't break frontend UX

---

### Story 1.5: Quick Add by URL Modal

**As a** user discovering content online,
**I want** to quickly save a URL and have details auto-filled,
**so that** I can capture content in seconds without manual data entry.

#### Acceptance Criteria

1. Create QuickAddModal component with URL input field
2. Add "Quick Add URL" button to Content Library header
3. URL input supports paste detection and auto-triggers analysis
4. "Analyze with AI" button calls AI Edge Function with loading state
5. Display loading spinner with progress message during AI processing (up to 10s)
6. Show preview section with AI-extracted data (all fields editable):
   - Title (text input)
   - AI Summary (textarea, 3-4 lines)
   - Thumbnail preview (with "Change Image" option)
   - Source, Creator, Time estimate (all editable)
7. Include Dashboard Areas multi-select
8. Include Priority, Status, Tags, Folder, Value Rating fields
9. "Save Content" button creates new content item
10. On AI failure: show error message and switch to manual entry mode
11. Modal follows existing modal styling (dark theme, gray-800 background)

#### Integration Verification

**IV1**: Quick Add saves to same content_library table as existing Add Content flow
**IV2**: React Query cache updates correctly after Quick Add save
**IV3**: Quick Add modal closes and grid refreshes showing new content immediately

---

### Story 1.6: AI Summary Field in Existing Add/Edit Modals

**As a** user manually adding content,
**I want** to add or edit AI summaries and other new fields,
**so that** I maintain full control over all content metadata.

#### Acceptance Criteria

1. Add AI Summary textarea field to existing Add Content modal (above Notes field)
2. Add AI Summary textarea field to existing Edit Content modal
3. AI Summary field is optional and can be manually entered
4. Add Dashboard Areas selector to both modals
5. Add Value Rating input to both modals
6. Maintain all existing fields and functionality
7. Form validation updated to include new fields
8. Save operations update all new fields in database
9. Visual indicator ("AI" badge) when summary was AI-generated vs manually entered

#### Integration Verification

**IV1**: Existing manual content creation flow continues to work without AI features
**IV2**: Editing existing content preserves all original fields
**IV3**: Form submission uses existing Supabase insert/update patterns

---

### Story 1.7: Enhanced Details Modal with New Fields

**As a** user reviewing saved content,
**I want** to see full AI summaries, dashboard areas, and ratings in the details view,
**so that** I have complete context when deciding to consume content.

#### Acceptance Criteria

1. Add dedicated "AI Summary" section in details modal showing full text
2. Add "Dashboard Areas" section with all tagged area chips
3. Add "Value Rating" section with visual representation (stars/numeric)
4. Maintain existing sections: metadata, notes, tags, action buttons
5. AI Summary section clearly differentiated from user Notes section
6. Dashboard area chips clickable to filter by that area (optional enhancement)
7. Layout remains readable and well-organized with new sections

#### Integration Verification

**IV1**: Details modal for content without new fields displays cleanly (empty states)
**IV2**: Edit button from details modal properly populates edit form with all new fields
**IV3**: Delete/favorite actions continue working as expected

---

### Story 1.8: Dashboard Areas Filtering

**As a** user organizing content across multiple life areas,
**I want** to filter content by dashboard areas,
**so that** I can focus on content relevant to specific businesses or life domains.

#### Acceptance Criteria

1. Add "Dashboard Areas" filter section to existing filter panel
2. Display checkboxes for all businesses (dynamically loaded from businesses table)
3. Display checkboxes for life areas (Health, Life, Finance, Golf)
4. Filter logic uses PostgreSQL array containment query (@> operator)
5. Multiple dashboard areas can be selected (OR logic - show content tagged with any selected area)
6. Filter state persists during session
7. Active filters display count badge on filter button
8. "Clear filters" functionality includes dashboard areas

#### Integration Verification

**IV1**: Dashboard area filtering works alongside existing filters (source, category, status, etc.)
**IV2**: Filter queries use GIN index on dashboard_areas for performance
**IV3**: Filtered results display correctly in Pinterest grid layout

---

### Story 1.9: Value Rating Filtering and Sorting

**As a** user managing a large content library,
**I want** to filter and sort by value rating,
**so that** I can quickly find my highest-rated content worth revisiting.

#### Acceptance Criteria

1. Add "Value Rating" filter section with range selector (e.g., "8+", "5-7", "1-4")
2. Add "Sort by Rating" option to existing sort dropdown
3. Sort by rating shows highest-rated first (DESC order)
4. Filter by rating excludes unrated content when range selected
5. Option to filter "Rated Only" vs "Include Unrated"
6. Rating filter works with other active filters
7. Clear visual feedback for active rating filters

#### Integration Verification

**IV1**: Rating filter queries use indexed value_rating column for performance
**IV2**: Rating filter/sort doesn't break when content lacks rating (null handling)
**IV3**: Combined filters (rating + area + status) execute efficiently (<500ms)

---

### Story 1.10: Pinterest-Style Masonry Grid Layout Refinement

**As a** visual learner,
**I want** content displayed in an attractive Pinterest-style masonry grid,
**so that** browsing my content library feels engaging and easy to scan.

#### Acceptance Criteria

1. Implement CSS Grid masonry layout (or use library like react-masonry-css)
2. Grid adapts: 1 column (mobile), 2 columns (md), 3 columns (lg), 4 columns (xl)
3. Cards with longer summaries naturally occupy more vertical space
4. Grid maintains visual balance (no awkward gaps)
5. Smooth animations when cards are added/removed
6. Grid remains performant with 500+ items (virtualization if needed)
7. Maintain existing hover effects and card interactions
8. Responsive on all screen sizes

#### Integration Verification

**IV1**: Grid layout doesn't conflict with existing filter/sort functionality
**IV2**: Card click events and quick actions work correctly in masonry layout
**IV3**: Grid renders correctly with mix of cards (some with AI summaries, some without)

---

## 6. Implementation Priority

**Phase 1 - Foundation (Stories 1.1, 1.2, 1.3)**:
- Build core UI components without AI dependency
- Low risk, immediate visual value
- Can be deployed independently

**Phase 2 - AI Integration (Stories 1.4, 1.5)**:
- Add AI service layer and Quick Add feature
- Higher complexity, requires external service setup
- Feature flag enabled for testing

**Phase 3 - Enhancement (Stories 1.6, 1.7)**:
- Integrate new fields into existing modals
- Moderate risk to existing functionality
- Thorough testing required

**Phase 4 - Advanced Features (Stories 1.8, 1.9, 1.10)**:
- Filtering, sorting, and visual refinement
- Polish and performance optimization
- Final deployment

---

**PRD Complete** ✅

Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
