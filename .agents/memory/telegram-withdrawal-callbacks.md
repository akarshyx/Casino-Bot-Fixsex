---
name: Telegram withdrawal callbacks
description: Durable constraints for owner approval and rejection buttons in the Telegram casino bot.
---

Withdrawal callback identifiers can contain multiple underscores, including the `npw_<user>_<timestamp>` format. Parse them by removing the complete callback prefix, never by taking a fixed underscore-delimited field.

Owner withdrawal actions should be routed through a dedicated callback path before generic player-button ownership protection. The callback must still perform its own owner/manager authorization check.

**Why:** A legacy split-based route reduced valid withdrawal IDs to `npw`, and the generic callback path can treat owner inbox messages as another player's message. Both failures make approval or rejection appear unresponsive.

**How to apply:** When adding or changing withdrawal buttons, keep callback prefixes explicit, preserve the entire ID suffix, register admin routes before the generic dispatcher, and surface callback exceptions to the owner instead of silently swallowing them.