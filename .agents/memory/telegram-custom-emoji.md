---
name: Telegram custom emoji entities
description: Telegram Bot API requirements for sending custom emoji IDs in Blackjack-style messages.
---

Use a valid emoji-shaped fallback character when creating a `custom_emoji` entity. Plain letters or digits inside a custom-emoji entity can make Telegram reject the entire message with `Entity_text_invalid`, after which fallback handling may display the raw characters.

**Why:** Telegram validates the fallback text covered by a custom-emoji entity, even when the custom sticker ID is valid.

**How to apply:** For custom emoji artwork whose visible design is a card, rank, or label, use the pack metadata emoji as the fallback and send the result as explicit `MessageEntity.CUSTOM_EMOJI` entities.