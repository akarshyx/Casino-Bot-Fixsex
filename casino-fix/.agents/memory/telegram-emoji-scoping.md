---
name: Telegram emoji scoping
description: Keep Telegram custom-emoji rendering scoped to each message family instead of applying one global pack to every screen.
---

Telegram custom emoji should be selected with a context-scoped allowlist when a product has multiple visual packs. Referral screens need simple, flat icons and should retain Unicode fallbacks; game screens may use richer pack art.

**Why:** A global Unicode interceptor can silently replace clean referral symbols with unrelated animated or mascot artwork from another pack.

**How to apply:** When adding a new Telegram screen, choose its emoji context explicitly and keep its allowed symbols separate from the global game renderer.