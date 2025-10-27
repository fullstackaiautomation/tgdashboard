# Note-Taking System

This project uses a structured three-file note-taking system to maintain clarity on project progress, architectural decisions, and known issues.

## Files Overview

### 1. [progress.md](progress.md)
**Purpose**: Track all completed tasks, current status, and next steps

**What to include**:
- ✅ Completed tasks with dates and details
- 📊 Current development status
- 🎯 Next steps and upcoming work
- 📈 Project statistics

**When to update**:
- **After every development session**
- Include what was done, impact, and files touched
- Add to "Completed Tasks" section with date

**Format**:
```markdown
### Task Name (Date)
- **Status**: ✅ Complete / 🔄 In Progress
- **Details**: What was done
- **Impact**: Why it matters
- **Files Modified**: List of changed files
```

---

### 2. [decisions.md](decisions.md)
**Purpose**: Log all architectural and design decisions with context

**What to include**:
- 🏗️ Architectural decisions
- 🎨 Design choices
- 💡 Solutions to technical challenges
- 🔄 Alternatives considered
- ⚖️ Trade-offs made

**When to update**:
- **Before or immediately after implementing a major decision**
- Document the "why", not just the "what"
- Include problem, decision, rationale, and impact

**Format**:
```markdown
### D-00X: [Decision Title]
**Date**: [DATE]
**Author**: Claude
**Status**: [In Progress / ✅ Implemented / ❌ Rejected]

**Problem**: [What problem prompted this?]
**Decision**: [What was decided?]
**Rationale**: [Why this choice?]
**Impact**: [How does this affect the project?]
**Trade-offs**: [Any downsides?]
```

Copy the template from decisions.md for new entries.

---

### 3. [BUGS.md](BUGS.md)
**Purpose**: Document bugs encountered and their solutions

**What to include**:
- 🐛 Bug reports with reproduction steps
- ❌ Error messages and stack traces
- ✅ Solutions and workarounds
- 🔍 Root cause analysis
- 📋 Troubleshooting guides

**When to update**:
- **When you encounter a bug**
- Include as much detail as possible
- Update status when bug is resolved
- Reference in progress.md if major

**Format**:
```markdown
### B-00X: [Bug Title]
**Date Reported**: [DATE]
**Severity**: [Critical / High / Medium / Low]
**Status**: [New / In Progress / ✅ Resolved]

**Description**: [What is the bug?]
**Steps to Reproduce**: [How to trigger it]
**Root Cause**: [Why it happens]
**Solution**: [How to fix it]
```

Copy the template from BUGS.md for new entries.

---

## System Rules

1. **progress.md** → Update after every development run
2. **decisions.md** → Log before/after architectural decisions
3. **BUGS.md** → Add bugs when encountered, update when resolved

## Benefits

✨ **Transparency** - Clear history of project development
✨ **Knowledge Preservation** - Document "why" decisions were made
✨ **Faster Debugging** - Reference known bugs and solutions
✨ **Better Onboarding** - New team members understand design choices
✨ **Accountability** - Track what was done and when

## Examples

### Progress Entry Example
```markdown
### Feature X Implementation (Oct 26, 2025)
- **Status**: ✅ Complete
- **Details**: Added new feature with validation and error handling
- **Impact**: Improves user experience and data integrity
- **Files Modified**: src/components/FeatureX.tsx, src/hooks/useFeatureX.ts
```

### Decision Entry Example
```markdown
### D-003: Use React Query for Server State
**Date**: Oct 26, 2025
**Status**: ✅ Implemented

**Problem**:
Multiple sources of truth for server data causing sync issues

**Decision**:
Adopt React Query for all server state management

**Rationale**:
Handles caching, synchronization, and background updates automatically
```

### Bug Entry Example
```markdown
### B-001: Tasks not syncing in real-time
**Date Reported**: Oct 26, 2025
**Severity**: High
**Status**: ✅ Resolved

**Problem**: Tasks updated in one tab don't appear in another
**Root Cause**: Real-time subscription wasn't initialized
**Solution**: Ensure useRealtimeSync hook is mounted in component tree
```

---

## Navigation

- **[progress.md](progress.md)** - Today's status and what's been done
- **[decisions.md](decisions.md)** - Why architecture looks the way it does
- **[docs/BUGS.md](docs/BUGS.md)** - Known issues and how to solve them
- **[CLAUDE.md](CLAUDE.md)** - Project overview and documentation index

---

## Tips

- Use consistent formatting for searchability
- Include dates for historical context
- Reference other documents when relevant
- Keep descriptions concise but detailed
- Use status indicators (✅, ❌, 🔄) for quick scanning
