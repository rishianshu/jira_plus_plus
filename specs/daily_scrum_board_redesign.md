# 🧭 Daily Scrum Board – Redesign Specification

## Purpose
Redesign the Daily Scrum Board to make team performance tracking intuitive, manager-friendly, and AI-driven.  
The new design should highlight progress, blockers, and trends through visual hierarchy and real-time insights.

---

## 🎯 Design Objectives
- Improve visibility and scanning efficiency.
- Reduce information clutter while preserving context.
- Integrate AI summaries inline with data.
- Maintain responsive and mobile-friendly layouts.
- Enable quick manager decision-making with filters and metrics.

---

## 🧱 Layout Overview
```

Header
├── Project selector + Date picker + Refresh + Auto-refresh
├── Metrics bar (Total Logged | Pending | Blocked | Done | Backlog)
├── Tabs: [Team Overview | Focus Mode]
Main Content
├── Team Cards (scrollable grid)
├── Focus Section (expanded view)
└── AI Summary Drawer (right-side slide-in)

```

---

## 🧩 Components

### 1. Header
- Project selector and date picker with a “Refresh” and “Auto-refresh” toggle.
- Displays “Last Updated” timestamp.
- Includes an “Export Summary” dropdown → `PDF | Slack | Jira Comment`.

### 2. Metrics Bar
- Sticky at top of viewport.
- Displays team-wide totals:
  - `hours_logged`
  - `pending_tasks`
  - `blocked`
  - `done`
  - `backlog`
- Animated refresh indicator.
- Example:
```

⏱️ 45h Logged | 🧩 12 Pending | 🚧 4 Blocked | ✅ 26 Done | 📋 6 Backlog

```

### 3. Team Overview Cards
Each card represents one user.

| Field | Description |
|--------|--------------|
| Name + Avatar | User identification |
| Status | `On Track`, `Delayed`, `Blocked`, `Idle` |
| Work Summary | `4h logged | 3 Done | 1 Blocked` |
| Yesterday / Today / Blockers | Expandable section |
| Progress Indicator | Linear progress bar |
| Click Behavior | Opens AI Summary drawer |

**Visual styling:**
```css
OnTrack: bg-green-50 border-green-300
Delayed: bg-yellow-50 border-yellow-300
Blocked: bg-red-50 border-red-300
Idle: bg-gray-50 border-gray-300
```

**Layout:**

* Horizontally scrollable on wide screens.
* Compact stacked grid on smaller viewports.
* Hover → shadow-sm elevation.
* Click → open drawer.

### 4. AI Summary Drawer

* Appears when a team card is selected.
* Right slide-in modal.
* Contains:

  * User name and status badge.
  * Key accomplishments.
  * Blockers and risks.
  * AI-generated insight chips.
* “Regenerate Summary” button refreshes AI snapshot.
* Example:

  ```
  ⚡ Abhijeet completed 3 tasks today.
  🚧 Blocked by env pod restart.
  📈 Risk: Moderate.
  ```

### 5. Focus Mode

* Tab view showing all users’ Yesterday/Today/Blockers.
* Expandable sections.
* Filters: `All | On Track | Blocked | Delayed | Idle`.
* Ideal for detailed review sessions.

---

## 🎨 Visual & Typography

| Element       | Treatment                                  |
| ------------- | ------------------------------------------ |
| Font          | Inter / Roboto                             |
| Font Sizes    | 14–18px                                    |
| Spacing       | 8px / 16px / 24px rhythm                   |
| Border radius | 12–16px                                    |
| Shadows       | `shadow-sm` on hover                       |
| Theme         | Light mode default, Dark mode supported    |
| Cards         | Rounded, minimal, with clear color accents |

---

## ⚙️ Interactions

* Click on user → AI Summary drawer opens.
* Hover → Show work metrics tooltip.
* Auto-refresh toggle with spinner animation.
* Tab switch preserves scroll and filters.
* Export Summary triggers backend or webhook.

---

## 🧠 AI Integration

* Inline contextual summaries using GPT-powered summarizer.
* Detect daily patterns like:

  * “Highest Output”
  * “Most Blocked”
  * “No Activity Detected”
* Display dynamic AI badges in the metrics bar.
* AI Summary updates every refresh cycle or on demand.

---

## 🧰 Technical Implementation (React / Next.js)

```tsx
<PageLayout>
  <Header />
  <MetricsBar />
  <Tabs>
    <Tab label="Team Overview">
      <TeamOverviewGrid />
    </Tab>
    <Tab label="Focus Mode">
      <FocusView />
    </Tab>
  </Tabs>
  <AISummaryDrawer />
</PageLayout>
```

**Suggested libraries:**

* `shadcn/ui` → Tabs, Cards, Drawer, Button
* `lucide-react` → Icons
* `framer-motion` → Animations
* `TailwindCSS` → Styling

---

## 🚀 Future Enhancements

* Comparison view: Today vs Yesterday performance delta.
* Sprint-level trends visualization.
* AI-based “Risk Alerts”.
* Role-based dashboard (Developer, Manager, QA).
* Slack & Jira integration for automated daily digests.

---

✅ **Expected Outcome**
A sleek, AI-augmented Daily Scrum Board that simplifies status tracking, enables data-driven discussions, and reduces manual reporting friction.

