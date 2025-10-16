# 📘 Jira++ — Project Specification (Business Overview)

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
|------|-------------|
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
- **Frontend:** React + GraphQL + shadcn/ui  
- **Backend:** Node.js (Apollo) + Prisma + Postgres  
- **Integration:** Jira REST API  
- **AI:** GPT-based summarization & follow-up detection

---

## 5. 🧠 Data Flow
1. Fetch Jira data (issues, comments, worklogs)  
2. Store locally via Prisma models  
3. Generate AI summaries  
4. Render dashboards for each persona

---

## 6. 🧾 Governance
All features link to Jira stories. Specs must follow the tiered flow: **Business → Product → Technical → Developer → Test** (see [`guidelines/spec_templates.md`](../guidelines/spec_templates.md)).

---

## 7. 📅 Next Deliverables
- Daily Scrum Board – [`features/daily_scrum_board/overview.md`](../features/daily_scrum_board/overview.md)
- Developer Focus Board – [`features/developer_focus_board/overview.md`](../features/developer_focus_board/overview.md)
- Manager Summary Board – [`features/manager_summary_board/overview.md`](../features/manager_summary_board/overview.md)
- Jira Integrator – [`integrations/jira/overview.md`](../integrations/jira/overview.md)
