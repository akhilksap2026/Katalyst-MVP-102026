---
name: Browser runtime on Nix
description: Why direct browser audits should use the managed Chromium runtime
---

Use a managed Nix Chromium runtime for direct browser audits rather than assuming Playwright's downloaded Linux browser can run.

**Why:** Downloaded browsers can lack the shared-library paths expected on Nix. Borrowing a desktop application's library directory can instead introduce incompatible libc/libstdc++ versions and break Node.

**How to apply:** Install the compatible system browser through supported package management and select its executable. Do not modify shared library paths using unrelated application's bundled libraries.