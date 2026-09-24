---
name: Python Telegram package collision
description: Avoid the unrelated telegram distribution when installing python-telegram-bot.
---

The project must install `python-telegram-bot` without the separate PyPI package named `telegram`; the two distributions share the `telegram` module, and the unrelated package can overwrite the correct package initializer.

**Why:** The collision makes imports such as `InlineKeyboardButton` fail even when `python-telegram-bot` is installed.

**How to apply:** Keep `telegram` out of dependency files. If the managed package operation leaves the stale distribution behind, verify `from telegram import InlineKeyboardButton` and use the environment's supported force-reinstall path for `python-telegram-bot`.

The managed package helper may report an uninstall/reinstall as successful while preserving a stale `telegram` distribution or appending it back to `requirements.txt`. Always inspect both the installed distributions and the dependency file before trusting the result.