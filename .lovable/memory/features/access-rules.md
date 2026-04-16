---
name: Access rules
description: Architects/Explorers have full access to all events; Day passes and event guests have no tag
type: feature
---
- **Arquitetos** and **Explorers** have access to ALL events and must appear as "inscritos" (registered) in every event's search and stats.
- Their count is based on the `tag` field on the `people` table (Arquiteto, Explorer), NOT on individual registration records.
- **Day Pass** holders and **event-specific guests** (Standard tickets) should appear as registered in their specific event only, WITHOUT any tag/badge on their people record.
- Only Arquiteto and Explorer tags should exist on the `people` table. No "Day Pass" tag.
- Import function derives tags only for architect/explorer tickets. All others get `null` tag.
