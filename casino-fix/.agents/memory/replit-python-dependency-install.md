---
name: Replit Python dependency install
description: Keep the project's requirements file authoritative after package-manager operations.
---

Package installation can reconcile from an older requirements snapshot and reintroduce removed entries, so inspect and clean the dependency file after installs.

**Why:** A stale unrelated Telegram distribution reappeared during environment setup and broke `python-telegram-bot` imports.

**How to apply:** Keep only `python-telegram-bot[job-queue]` in the project requirements, never the separate `telegram` package, and rerun an import check after dependency changes.