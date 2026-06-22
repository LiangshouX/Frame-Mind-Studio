# Data Model: ScriptMind 剧本工作流补全

**Date**: 2026-06-22

## Existing Entities (No Schema Changes)

All entities already exist in the database. No Flyway migrations needed.

### Project (projects table)

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| title | VARCHAR | Project name |
| genre | JSONB | Genre tags array |
| format | VARCHAR | short_drama / movie |
| logline | VARCHAR | One-line synopsis |
| description | TEXT | Optional description |
| status | VARCHAR | draft / active / completed |

### Character (characters table)

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| project_id | UUID | FK → Project |
| name | VARCHAR | Character name (unique per project) |
| gender | VARCHAR | Male / Female / Other |
| role | VARCHAR | protagonist / antagonist / supporting / minor |
| identity | VARCHAR | Identity / position |
| persona | TEXT | Short drama only: persona traits & memory points |
| background | TEXT | Movie only: backstory & motivation |
| arc | TEXT | Movie only: character growth arc |
| overview | TEXT | Character biography / summary |
| personality | JSONB | Personality tags array |
| appearance | TEXT | Physical description |
| goals | TEXT | Character goals |
| relationships | JSONB | Relationship array |
| dialogue_style | TEXT | Dialogue style description |

### WorldSetting (world_settings table)

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| project_id | UUID | FK → Project (1:1) |
| content | JSONB | Structured world setting document |

Content schema:
```json
{
  "genre_type": "string",
  "style_tone": "string",
  "era_background": "string",
  "unique_selling_point": "string",
  "world_view": "string",
  "core_conflict": "string",
  "world_rules": "string",
  "locations": ["string"],
  "themes": "string"
}
```

### Synopsis (synopses table)

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| project_id | UUID | FK → Project (1:1) |
| content | JSONB | Synopsis content |

Content schema:
```json
{
  "main_plot": "string",
  "core_conflict": "string",
  "turning_points": "string",
  "ending": "string",
  "themes": "string"
}
```

### Outline (outlines table)

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| project_id | UUID | FK → Project (1:1) |
| content | JSONB | Outline content |
| format | VARCHAR | episode_list / act_structure |

Short drama content schema:
```json
{
  "episodes": [
    {
      "episode_number": 1,
      "title": "string",
      "highlight": "string",
      "hook": "string",
      "key_events": ["string"],
      "duration": "string"
    }
  ]
}
```

### Script (scripts table)

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| project_id | UUID | FK → Project (1:1) |
| content | JSONB | Script content |
| format_type | VARCHAR | short_drama / traditional |
| word_count | INTEGER | Auto-computed |
| scene_count | INTEGER | Auto-computed |
| episode_count | INTEGER | Auto-computed |

### ReviewReport (review_reports table)

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| project_id | UUID | FK → Project |
| scope | VARCHAR | full / episode |
| episode_number | INTEGER | null for full review |
| report | JSONB | Review report |

### Foreshadow (foreshadows table)

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| project_id | UUID | FK → Project |
| plant | TEXT | Planted foreshadow content |
| payoff | TEXT | Resolved content |
| status | VARCHAR | planted / hinted / resolved |
| urgency | VARCHAR | high / medium / low |
| character_id | UUID | Optional FK → Character |
| notes | TEXT | Additional notes |
