---
name: React runtime compatibility
description: Runtime checks needed when importing React prerelease applications into a stable workspace
---

When importing a prerelease React application, verify that its React APIs exist in the installed runtime; successful TypeScript compilation is not sufficient.

**Why:** Newer React typings can expose experimental APIs while the workspace's stable React runtime lacks them, allowing a clean typecheck followed by a render failure.

**How to apply:** Keep the stable workspace runtime unless there is a deliberate reason to adopt a prerelease. Adapt unsupported presentation APIs without changing tool behavior, and confirm the live preview before delivery.