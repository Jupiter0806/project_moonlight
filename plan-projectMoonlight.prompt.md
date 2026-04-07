# Project Moonlight Development Plan

## Vision

**"Learn in Day, Review in Night"**

An application designed to optimize the learning process by distinguishing between the _acquisition_ phase (Day) and the _retention_ phase (Night).

## Core Concepts

### 1. Day Mode (Input & Active Learning)

- **Goal**: AI assisted answer and note-taking to capture knowledge in real-time.
- **Features**:
  - AI-powered Q&A interface for quick information retrieval.
  - AI-powered language understanding to summarize and highlight key points.
  - Resource bookmarking.
  - "Today's Focus" list.
  - Categorization (tags/topics/groups).
  - Able to highlight parts of the answer which will assist a summary generation and review process in the Night Mode.

### 2. Night Mode (Review & Consolidation)

- **Goal**: Active recall and transferring checks to long-term memory.
- **Features**:
  - Daily recap summary, generated from highlights and notes taken during Day Mode.
  - Spaced Repetition System (SRS) interactions.
  - Sleep-friendly UI (dark mode default).
  - Progress visualization.
  - History and insights dashboard.

## Proposed Tech Stack (Draft)

- **Frontend**: React, TypeScript, Tailwind, Next.js
- **Backend/Storage**: Firebase Node.js

## Development Standards

- **Testing**: Always generate unit tests when implementing a feature or component.
  - Tests must be based on the **stated requirements**, not the implementation details, so core behavior is protected regardless of internal changes.
  - Always include edge case coverage alongside happy-path tests. Edge cases to consider:
    - Default/initial state renders correctly without errors.
    - Empty or missing values are handled gracefully.
    - State is independent between unrelated atoms/fields (changes to one don't affect the other).
    - Repeated or toggled actions are idempotent or reversible (e.g. swap twice restores originals).
    - Reactive updates: external state changes are reflected in the UI.
  - If requirements are clear, proceed directly to implementation and tests.
  - If requirements are ambiguous or incomplete, ask for clarification **before** implementing.

- **Commit Format**: Follow [Conventional Commits](https://www.conventionalcommits.org/).
  - `feat`: New feature.
  - `fix`: Bug fix.
  - `docs`: Documentation only changes.
  - `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc).
  - `refactor`: A code change that neither fixes a bug nor adds a feature.
  - `perf`: A code change that improves performance.
  - `test`: Adding missing tests or correcting existing tests.
  - `chore`: Changes to the build process or auxiliary tools.

## Immediate Next Steps

- icon library research and selection.
- accessibility review and implementation plan.
