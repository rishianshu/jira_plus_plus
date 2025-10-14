

# Feature: Daily Scrum Board

## Purpose
Automate and simplify daily stand-ups by providing AI-generated “Yesterday / Today / Blockers” summaries for each team member based on their Jira activities. This feature replaces the need for manual daily status updates, allowing scrums to be shorter and more focused.

## Objectives
- Summarize daily progress automatically using comments, worklogs, and issue updates.
- Identify blockers or delays using issue transitions or keywords.
- Present a concise, structured view for the entire team.
- Allow managers to export or regenerate summaries on demand.

---

## Data Flow
1. **Data Source:**  
   - Jira issues, comments, and worklogs filtered by last 24 hours.  
2. **Extraction:**  
   - Retrieve all updated issues, worklogs, and comments for each team member.  
3. **Processing:**  
   - Group activities by user.  
   - Use GPT-based summarization for “Yesterday’s work,” “Today’s plan,” and “Blockers.”  
   - Detect blockers via issue statuses (“Blocked,” “On Hold”) or keywords (“stuck,” “waiting”).  
4. **Storage:**  
   - Save generated summaries in a local `DailySummary` table.  
5. **Presentation:**  
   - Render user cards with AI summaries and provide regeneration option.

---

## GraphQL Schema
```graphql
type DailySummary {
  id: ID!
  user: User!
  date: Date!
  yesterday: String
  today: String
  blockers: String
  updatedAt: DateTime!
}

type Query {
  dailySummaries(date: Date!): [DailySummary!]!
}
```

---

## UI Specification (React + shadcn/ui)
**Page:** `/scrum`  
**Sections:**
1. **Team Summary View:**  
   - Each user displayed as a card with “Yesterday / Today / Blockers.”  
   - Color-coded status: 🟢 on-track, 🟠 delayed, 🔴 blocked.
2. **AI Summary Panel:**  
   - “Regenerate Summary” button triggers fresh GPT generation.
3. **Export Options:**  
   - Export summaries to PDF or Slack channel.

**Components:**
- `ScrumHeader.tsx` – sprint and date filters  
- `UserSummaryCard.tsx` – per-user summary display  
- `AISummaryPanel.tsx` – handles regeneration & status  
- `SummaryExport.tsx` – export to PDF or Slack  

---

## API Endpoints
| Endpoint | Method | Description |
|-----------|--------|-------------|
| `/api/scrum/summaries` | GET | Fetch summaries for all users |
| `/api/scrum/generate` | POST | Generate AI summaries |
| `/api/scrum/export` | POST | Export summaries to external systems |

---

## AI Prompt Template
```json
{
  "prompt": "Generate a stand-up summary with Yesterday’s work, Today’s plan, and Blockers from this developer’s Jira data.",
  "input": "{comments, worklogs, issues}",
  "output_format": {
    "yesterday": "string",
    "today": "string",
    "blockers": "string"
  }
}
```

---

## Acceptance Criteria
- [ ] Each team member’s summary generated automatically.
- [ ] Blockers detected using issue status or keywords.
- [ ] “Regenerate Summary” re-runs AI logic for a single user.
- [ ] Export to PDF and Slack works reliably.
- [ ] Page loads summaries under 2 seconds.

---

## Future Enhancements
- Add support for weekly rollups.
- Include AI-detected “risk indicators.”
- Enable summary comparison between sprints.