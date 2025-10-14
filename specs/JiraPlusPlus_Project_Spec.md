/Users/rishikeshkumar/Development/jira_plus_plus/specs/JiraPlusPlus_Project_Spec.md
# 📘 Jira++ — Project Specification (Business + Technical Overview)

### Version
v0.1 – October 2025  
**Author:** Rishikesh Singh  
**Preferred Tech Stack:** React + TypeScript + GraphQL (Apollo) + shadcn/ui + Node.js + Prisma + Postgres  

---

## 1. 🧭 Vision
Jira++ transforms daily scrums and reviews into AI-driven insights. It provides meaningful summaries, focuses on blockers, and improves sprint transparency.

---

## 2. 🎯 Objectives
| Goal | Description |
|------|--------------|
| Developer Focus | Summarize yesterday, today, and blockers clearly |
| Manager Insight | Offer high-level summaries with AI |
| Transparency | Unified view for team and clients |
| Productivity | Reduce meeting time and boost clarity |

---

## 3. 🧱 Core Modules
**Phase 1:** Daily Scrum Board, Developer Focus Board, Manager Summary Board, Jira Integrator  
**Phase 2:** Sprint Health, Auto Follow-Ups, Team Analytics  
**Phase 3:** Predictive Blockers, Project Heatmap, Meeting Summaries

---

## 4. 🧩 Architecture Overview
Frontend: React + GraphQL + shadcn/ui  
Backend: Node.js (Apollo) + Prisma + Postgres  
Integration: Jira REST API  
AI: GPT-based summarization & follow-up detection  

---

## 5. 🧠 Data Flow
1. Fetch Jira data (issues, comments, worklogs)
2. Store locally in Prisma models
3. Generate AI summaries
4. Render summaries on dashboards

---

## 6. 🧾 Governance
All features link to Jira stories. Specs must follow: Purpose → Data Flow → Schema → UI → API → Acceptance.

---

## 7. 📅 Next Deliverables
- feature_daily_scrum_board.md  
- feature_developer_focus_board.md  
- feature_manager_summary_board.md  
- feature_jira_integrator.md

/Users/rishikeshkumar/Development/jira_plus_plus/specs/feature_daily_scrum_board.md
# Feature: Daily Scrum Board

## Purpose
Provide AI-driven "Yesterday / Today / Blockers" summaries per user.

## Data Flow
1. Pull Jira comments & worklogs.
2. Generate summaries with GPT.
3. Render user-wise cards.

## GraphQL Schema
type DailySummary { user: User!, yesterday: String, today: String, blockers: String }

## UI Spec
- Page: /scrum
- Components: UserCard, SummaryBox
- Actions: regenerate summary, filter by sprint/team.

## API Endpoints
POST /api/jira/sync — sync data  
POST /api/summary/generate — generate summaries  

## Acceptance Criteria
- [ ] Summaries generated per user  
- [ ] Display grouped by team/project  
- [ ] Refresh regenerates data  

/Users/rishikeshkumar/Development/jira_plus_plus/specs/feature_developer_focus_board.md
# Feature: Developer Focus Board

## Purpose
Give developers a single view of assigned issues, comments, and upcoming tasks.

## Data Flow
1. Fetch issues assigned to user.
2. Merge with worklogs and recent comments.
3. Show focus areas and blockers.

## GraphQL Schema
type FocusBoard { user: User!, issues: [Issue!]!, blockers: [Blocker!] }

## UI Spec
- Page: /focus
- Tabs: My Issues, Comments, Blockers

## API Endpoints
GET /api/user/issues — fetch assigned issues  

## Acceptance Criteria
- [ ] Filter by sprint/project  
- [ ] Highlights recent blockers  
- [ ] Daily focus auto-refresh  

/Users/rishikeshkumar/Development/jira_plus_plus/specs/feature_manager_summary_board.md
# Feature: Manager Summary Board

## Purpose
Provide an aggregated view of team progress, blockers, and sprint health.

## Data Flow
1. Collect all team summaries.
2. Compute completion rates and blockers.
3. Display as a summarized dashboard.

## GraphQL Schema
type ManagerSummary { team: String!, sprint: String!, progress: Float!, blockers: [Blocker!] }

## UI Spec
- Page: /manager
- Widgets: Sprint health, Blocker trend, Top performers

## API Endpoints
GET /api/manager/summary — aggregated data  

## Acceptance Criteria
- [ ] Real-time summary view  
- [ ] Shows sprint completion rate  
- [ ] Highlight blocked users/issues  

/Users/rishikeshkumar/Development/jira_plus_plus/specs/feature_jira_integrator.md
# Feature: Jira Data Integrator

## Purpose
Sync Jira issues, comments, and worklogs into local DB for all other modules.

## Data Flow
1. Call Jira REST APIs.
2. Normalize data into Prisma models.
3. Cache results for faster querying.

## GraphQL Schema
type Issue { id: ID!, key: String!, summary: String, status: String }
type Comment { id: ID!, text: String, author: String }
type Worklog { id: ID!, description: String, timeSpent: Int }

## API Endpoints
POST /api/jira/sync — fetch & persist  
GET /api/jira/issues — list synced issues  

## Acceptance Criteria
- [ ] Sync all data correctly  
- [ ] Handle pagination & auth  
- [ ] Provide unified interface for other modules  
