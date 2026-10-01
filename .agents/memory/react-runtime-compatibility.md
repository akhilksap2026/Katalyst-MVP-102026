---
name: React runtime compatibility
description: Runtime checks needed when importing React prerelease applications into a stable workspace
---

When importing a prerelease React application, verify that its React APIs exist in the installed runtime; successful TypeScript compilation is not sufficient.

**Why:** Newer React typings can expose experimental APIs while the workspace's stable React runtime lacks them, allowing a clean typecheck followed by a render failure.

**How to apply:** Keep the stable workspace runtime unless there is a deliberate reason to adopt a prerelease. Adapt unsupported presentation APIs without changing tool behavior, and confirm the live preview before delivery.

Workspace UI consumers must also resolve one React/React DOM runtime.

**Why:** Dependency refreshes with shared UI packages produced null hook-dispatcher errors despite passing type checks; deduplicated runtime resolution eliminated them in the live checks.

**How to apply:** Configure runtime deduplication for shared UI consumption, and distinguish duplicate-runtime failures from unsupported-API failures.