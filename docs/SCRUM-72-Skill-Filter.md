# SCRUM-72: Skill Filter — Filter Workers by Skill

## Story

**As a** Service Seeker,
**I want to** filter workers by skill,
**So that** I can find workers relevant to my needs.

**Epic:** Worker Discovery
**Sprint:** Sprint 2
**Branch:** `SCRUM-71-Explore-Service-Providers`

---

## Description

The system provides a skill-based filtering option on the Browse Workers page, allowing service seekers to narrow the worker list by a specific skill or service category. The filtered results update the displayed list to show only workers matching the selected skill.

Skill filtering improves the efficiency of worker discovery, reducing the effort needed to identify the most relevant service providers for a given task.

---

## Acceptance Criteria

| ID      | Criteria                                                                                                                         | Status      |
| ------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| **AC1** | Given the seeker is on the Browse Workers page, when the seeker selects a skill from the filter options, then the system shall display only workers who have that skill listed in their profile. | Implemented |
| **AC2** | Given a skill filter is active, when the seeker clears or resets the filter, then the system shall display the full unfiltered worker list. | Implemented |
| **AC3** | Given no workers match the selected skill filter, then the system shall display a "No workers found for this skill" message. | Implemented |

---

## Implementation Summary

### Changes Made

This feature builds on SCRUM-71 (Browse Workers page) by replacing the free-text skill search with a dropdown selector.

**Before (SCRUM-71):**
- Text input that searched by skill name or worker name (combined)
- Free-form filtering

**After (SCRUM-72):**
- Dropdown select with predefined skill categories
- Uses existing `CATEGORIES` constant (12 service categories)
- Filters workers by matching selected category label against worker skills

### Files Modified

| File | Changes |
|------|---------|
| `frontend/src/pages/seeker/BrowseWorkersPage.jsx` | Replaced text input with `<select>` dropdown, updated filter logic, updated empty state messages |
| `frontend/src/pages/seeker/BrowseWorkersPage.css` | Added `.bw-skill-select` dropdown styles with responsive support |

**No backend changes required** — filtering is performed client-side using existing data.

---

## Technical Implementation

### State Changes

```jsx
// Before
const [skillSearch, setSkillSearch] = useState('');

// After
const [selectedSkill, setSelectedSkill] = useState('');
```

### Filter Logic

```jsx
const filteredWorkers = workers.filter(worker => {
    const selectedCategory = CATEGORIES.find(c => c.value === selectedSkill);
    const matchesSkill = !selectedSkill ||
        (worker.skills && worker.skills.some(skill =>
            skill.toLowerCase().includes(selectedCategory?.label.toLowerCase() || '')
        ));
    // ... location filter continues
});
```

### UI Component

```jsx
<select
    value={selectedSkill}
    onChange={(e) => setSelectedSkill(e.target.value)}
    className="bw-skill-select"
>
    <option value="">All Skills</option>
    {CATEGORIES.map(cat => (
        <option key={cat.value} value={cat.value}>
            {cat.icon} {cat.label}
        </option>
    ))}
</select>
```

### Available Skill Categories

The dropdown uses the `CATEGORIES` constant from `utils/constants.js`:

| Value | Label | Icon |
|-------|-------|------|
| PLUMBING | Plumbing | 🔧 |
| ELECTRICAL | Electrical | ⚡ |
| CARPENTRY | Carpentry | 🪚 |
| PAINTING | Painting | 🎨 |
| CLEANING | Cleaning | 🧹 |
| AC_REPAIR | AC Repair | ❄️ |
| APPLIANCE_REPAIR | Appliance Repair | 🔌 |
| GARDENING | Gardening | 🌱 |
| MASONRY | Masonry | 🧱 |
| ROOFING | Roofing | 🏠 |
| PEST_CONTROL | Pest Control | 🐛 |
| OTHER | Other | ⋯ |

---

## Empty State Messages

| Condition | Title | Description |
|-----------|-------|-------------|
| Skill filter active, no matches | "No workers found for this skill" | "No workers have "{Category}" listed in their skills." |
| Location filter only, no matches | "No matches found" | "Try adjusting your search filters to find more workers." |
| No workers in database | "No workers available" | "Be the first to join our platform or check back later!" |

---

## Testing Checklist

| #   | Test Case                                               | Expected Result                                           |
| --- | ------------------------------------------------------- | --------------------------------------------------------- |
| 1   | Open dropdown on Browse Workers page                    | Dropdown shows "All Skills" + 12 category options         |
| 2   | Select "Plumbing" skill                                 | Only workers with plumbing-related skills are shown       |
| 3   | Select "All Skills" (default option)                    | Full worker list is displayed                             |
| 4   | Select a skill with no matching workers                 | "No workers found for this skill" message displayed       |
| 5   | Click "Clear Filters" button when skill filter active   | Dropdown resets to "All Skills", full list shown          |
| 6   | Combine skill filter with location filter               | Both filters applied (AND logic)                          |
| 7   | Check responsive behavior (mobile)                      | Dropdown resizes appropriately                            |

---

## UI Preview

The skill filter dropdown appears in the search box alongside the location filter:

```
┌──────────────────────────────────────────────────────────────┐
│  🔧  [All Skills          ▾]  │  📍  [Filter by location...] │  ✕
└──────────────────────────────────────────────────────────────┘
```

When expanded:
```
┌────────────────────────┐
│ All Skills             │
├────────────────────────┤
│ 🔧 Plumbing            │
│ ⚡ Electrical          │
│ 🪚 Carpentry           │
│ 🎨 Painting            │
│ ...                    │
└────────────────────────┘
```

---

## Dependencies

- **SCRUM-71:** Browse Workers page (completed)
- **Constants:** `CATEGORIES` from `frontend/src/utils/constants.js`
- **No backend changes required**

---

## Business Value

Helps seekers quickly find workers with the exact skills they need, improving match quality and platform usability. This is a key component of the Worker Discovery epic.
