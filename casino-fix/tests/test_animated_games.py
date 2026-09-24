import asyncio
import time
from types import SimpleNamespace
import unittest
from unittest.mock import patch

import main


class _FakeDiceBot:
    def __init__(self, token, *, error=None):
        self.token = token
        self.error = error
        self.calls = []

    async def send_dice(self, *, chat_id, emoji):
        self.calls.append((chat_id, emoji))
        if self.error is not None:
            raise self.error
        return SimpleNamespace(dice=SimpleNamespace(value=4))


class AnimatedGameReliabilityTests(unittest.TestCase):
    @staticmethod
    def _dice_update(user_id, *, message_id, emoji="🎲"):
        replies = []

        async def reply_text(text, **kwargs):
            replies.append(text)

        message = SimpleNamespace(
            chat_id=9001,
            message_id=message_id,
            from_user=SimpleNamespace(id=user_id, first_name="Player", username=None),
            dice=SimpleNamespace(value=4, emoji=emoji),
            reply_text=reply_text,
            chat=SimpleNamespace(type="group"),
            forward_date=None,
            forward_origin=None,
        )
        return SimpleNamespace(message=message, replies=replies)

    def test_dealer_failure_does_not_create_duplicate_fallback_roll(self):
        original_dealers = dict(main.dealer_bots)
        failing_dealer = _FakeDiceBot("dealer-1", error=RuntimeError("network error"))
        fallback_dealer = _FakeDiceBot("dealer-2")
        main_bot = _FakeDiceBot("main")
        main.dealer_bots.clear()
        main.dealer_bots.update(
            {"dealer_1": failing_dealer, "dealer_2": fallback_dealer}
        )

        try:
            result = asyncio.run(
                main.dealer_send_dice(
                    chat_id=123,
                    emoji="🎲",
                    main_bot=main_bot,
                    chat_type="group",
                    dealer_name="dealer_1",
                )
            )
        finally:
            main.dealer_bots.clear()
            main.dealer_bots.update(original_dealers)

        self.assertIsNone(result)
        self.assertEqual(len(failing_dealer.calls), 1)
        self.assertEqual(
            fallback_dealer.calls,
            [],
            "a failed request must not be replayed through another bot",
        )

    def test_visible_dice_serializes_same_chat_but_not_other_chats(self):
        async def scenario():
            original_interval = main._DICE_CHAT_MIN_INTERVAL_SECONDS
            main._DICE_CHAT_MIN_INTERVAL_SECONDS = 0
            main._dice_chat_locks.clear()
            main._dice_chat_last_send.clear()
            active_by_chat = {}
            active_total = 0
            max_by_chat = {}
            max_total = 0

            async def fake_send_dice(*, chat_id, **kwargs):
                nonlocal active_total, max_total
                active_by_chat[chat_id] = active_by_chat.get(chat_id, 0) + 1
                active_total += 1
                max_by_chat[chat_id] = max(
                    max_by_chat.get(chat_id, 0), active_by_chat[chat_id]
                )
                max_total = max(max_total, active_total)
                await asyncio.sleep(0.01)
                active_by_chat[chat_id] -= 1
                active_total -= 1
                return SimpleNamespace(dice=SimpleNamespace(value=4))

            try:
                with patch.object(
                    main, "dealer_send_dice", side_effect=fake_send_dice
                ):
                    await asyncio.gather(
                        main._send_visible_dice(
                            chat_id=1,
                            emoji="🎲",
                            main_bot=None,
                            chat_type="group",
                        ),
                        main._send_visible_dice(
                            chat_id=1,
                            emoji="🎲",
                            main_bot=None,
                            chat_type="group",
                        ),
                        main._send_visible_dice(
                            chat_id=2,
                            emoji="🎲",
                            main_bot=None,
                            chat_type="group",
                        ),
                    )
                return max_by_chat, max_total
            finally:
                main._DICE_CHAT_MIN_INTERVAL_SECONDS = original_interval
                main._dice_chat_locks.clear()
                main._dice_chat_last_send.clear()

        max_by_chat, max_total = asyncio.run(scenario())
        self.assertEqual(max_by_chat[1], 1)
        self.assertEqual(max_by_chat[2], 1)
        self.assertGreaterEqual(
            max_total,
            2,
            "different chats should be able to animate concurrently",
        )

    def test_rapid_dice_updates_wait_for_the_same_game_lock(self):
        async def scenario():
            user_id = "animated-user"
            original_game = main.active_games.get(user_id)
            main.active_games[user_id] = {"type": "dice"}
            main._animated_roll_locks.clear()
            running = 0
            max_running = 0
            calls = 0

            async def fake_locked(update, context):
                nonlocal calls, running, max_running
                calls += 1
                running += 1
                max_running = max(max_running, running)
                await asyncio.sleep(0.01)
                running -= 1

            message = SimpleNamespace(
                chat_id=1,
                from_user=SimpleNamespace(id=user_id),
                dice=SimpleNamespace(value=4),
            )
            update = SimpleNamespace(message=message)
            try:
                with patch.object(
                    main, "_handle_dice_message_locked", side_effect=fake_locked
                ):
                    await asyncio.gather(
                        main.handle_dice_message(update, None),
                        main.handle_dice_message(update, None),
                    )
                return calls, max_running
            finally:
                main._animated_roll_locks.clear()
                if original_game is None:
                    main.active_games.pop(user_id, None)
                else:
                    main.active_games[user_id] = original_game

        calls, max_running = asyncio.run(scenario())
        self.assertEqual(calls, 2)
        self.assertEqual(
            max_running,
            1,
            "rapid rolls must queue instead of racing shared game state",
        )

    def test_duplicate_roll_is_idempotent_for_a_dice_session(self):
        async def scenario():
            user_id = "duplicate-user"
            original_game = main.active_games.get(user_id)
            main.active_games[user_id] = {
                "_created_at": time.time(),
                "type": "dice_bot",
                "game_name": "dice",
                "dice_emoji": "🎲",
                "state": "player_turn",
                "rolls": 2,
                "player_round_rolls": 0,
                "player_round_total": 0,
                "bot_round_total": 0,
                "player_wins": 0,
                "bot_wins": 0,
                "wins_needed": 3,
            }
            main._animated_roll_locks.clear()
            processed = 0

            async def fake_regular(*args):
                nonlocal processed
                processed += 1

            first = self._dice_update(user_id, message_id=101)
            duplicate = self._dice_update(user_id, message_id=101)
            try:
                with patch.object(main, "handle_animated_game_turn", side_effect=fake_regular), \
                     patch.object(main, "save_data"):
                    await main.handle_dice_message(first, None)
                    await main.handle_dice_message(duplicate, None)
                game = main.active_games[user_id]
                return processed, game["round_rolls"], game["_processed_roll_ids"]
            finally:
                main._animated_roll_locks.clear()
                if original_game is None:
                    main.active_games.pop(user_id, None)
                else:
                    main.active_games[user_id] = original_game

        processed, roll_count, ledger = asyncio.run(scenario())
        self.assertEqual(processed, 0)
        self.assertEqual(roll_count, 1)
        self.assertEqual(ledger, ["9001:101"])

    def test_selected_emoji_is_enforced_for_all_five_animated_games(self):
        async def scenario():
            cases = [
                ("dice", "player_dice", "🎲"),
                ("darts", "sports_darts_bot", "🎯"),
                ("basketball", "sports_basketball_bot", "🏀"),
                ("soccer", "sports_soccer_bot", "⚽"),
                ("bowling", "sports_bowling_bot", "🎳"),
            ]
            original_games = {
                f"emoji-{game_name}": main.active_games.get(f"emoji-{game_name}")
                for game_name, _, _ in cases
            }
            main._animated_roll_locks.clear()
            try:
                results = []
                for index, (game_name, game_type, expected_emoji) in enumerate(cases):
                    user_id = f"emoji-{game_name}"
                    game_data = {
                        "_created_at": time.time(),
                        "type": game_type,
                        "state": "player_turn",
                        "dice_emoji": expected_emoji,
                        "emoji": expected_emoji,
                        "rolls": 1,
                        "round_rolls": 0,
                        "player_round_total": 0,
                        "player_wins": 0,
                        "bot_wins": 0,
                        "wins_needed": 3,
                    }
                    if game_name != "dice":
                        game_data["game_name"] = game_name
                    main.active_games[user_id] = game_data
                    wrong_emoji = "🎲" if expected_emoji != "🎲" else "🎯"
                    update = self._dice_update(
                        user_id,
                        message_id=300 + index,
                        emoji=wrong_emoji,
                    )
                    with patch.object(main, "save_data"):
                        await main.handle_dice_message(update, None)
                    results.append(
                        (
                            game_name,
                            list(update.replies),
                            game_data.get("round_rolls", 0),
                            game_data.get("player_round_total", 0),
                        )
                    )
                return results
            finally:
                main._animated_roll_locks.clear()
                for user_id, previous in original_games.items():
                    if previous is None:
                        main.active_games.pop(user_id, None)
                    else:
                        main.active_games[user_id] = previous

        results = asyncio.run(scenario())
        for game_name, replies, round_rolls, round_total in results:
            with self.subTest(game=game_name):
                self.assertEqual(replies, [])
                self.assertEqual(round_rolls, 0)
                self.assertEqual(round_total, 0)

    def test_duplicate_roll_is_idempotent_for_all_five_animated_games(self):
        async def scenario():
            cases = [
                ("dice", "player_dice", "🎲"),
                ("darts", "sports_darts_bot", "🎯"),
                ("basketball", "sports_basketball_bot", "🏀"),
                ("soccer", "sports_soccer_bot", "⚽"),
                ("bowling", "sports_bowling_bot", "🎳"),
            ]
            original_games = {
                f"duplicate-{game_name}": main.active_games.get(f"duplicate-{game_name}")
                for game_name, _, _ in cases
            }
            main._animated_roll_locks.clear()
            try:
                results = []
                async def fake_regular(*args):
                    return None

                with patch.object(main, "handle_animated_game_turn", side_effect=fake_regular), \
                     patch.object(main, "save_data"):
                    for index, (game_name, game_type, expected_emoji) in enumerate(cases):
                        user_id = f"duplicate-{game_name}"
                        game_data = {
                            "_created_at": time.time(),
                            "type": game_type,
                            "state": "player_turn",
                            "dice_emoji": expected_emoji,
                            "emoji": expected_emoji,
                            "rolls": 2,
                            "round_rolls": 0,
                            "player_round_total": 0,
                            "player_wins": 0,
                            "bot_wins": 0,
                            "wins_needed": 3,
                        }
                        if game_name != "dice":
                            game_data["game_name"] = game_name
                        main.active_games[user_id] = game_data
                        first = self._dice_update(
                            user_id,
                            message_id=400 + index,
                            emoji=expected_emoji,
                        )
                        duplicate = self._dice_update(
                            user_id,
                            message_id=400 + index,
                            emoji=expected_emoji,
                        )
                        await main.handle_dice_message(first, None)
                        await main.handle_dice_message(duplicate, None)
                        results.append(
                            (
                                game_name,
                                game_data.get("round_rolls", 0),
                                game_data.get("player_round_total", 0),
                                game_data.get("_processed_roll_ids"),
                            )
                        )
                return results
            finally:
                main._animated_roll_locks.clear()
                for user_id, previous in original_games.items():
                    if previous is None:
                        main.active_games.pop(user_id, None)
                    else:
                        main.active_games[user_id] = previous

        results = asyncio.run(scenario())
        for game_name, round_rolls, round_total, ledger in results:
            with self.subTest(game=game_name):
                self.assertEqual(round_rolls, 1)
                self.assertEqual(round_total, 4)
                self.assertEqual(len(ledger), 1)

    def test_wrong_emoji_and_repeated_bot_turn_rolls_do_not_change_state_or_spam(self):
        async def scenario():
            user_id = "wrong-turn-user"
            original_game = main.active_games.get(user_id)
            main.active_games[user_id] = {
                "_created_at": time.time(),
                "type": "sports_darts_bot",
                "game_name": "darts",
                "dice_emoji": "🎯",
                "state": main.EmojiGameState.WAITING_BOT_ROLL,
                "round": 1,
                "player_round_rolls": 0,
            }
            main._animated_roll_locks.clear()
            first = self._dice_update(user_id, message_id=201, emoji="🎯")
            second = self._dice_update(user_id, message_id=202, emoji="🎯")
            wrong = self._dice_update(user_id, message_id=203, emoji="🎲")
            try:
                with patch.object(main, "save_data"):
                    await main.handle_dice_message(first, None)
                    await main.handle_dice_message(second, None)
                    await main.handle_dice_message(wrong, None)
                game = main.active_games[user_id]
                return list(first.replies), list(second.replies), list(wrong.replies), game
            finally:
                main._animated_roll_locks.clear()
                if original_game is None:
                    main.active_games.pop(user_id, None)
                else:
                    main.active_games[user_id] = original_game

        first_replies, second_replies, wrong_replies, game = asyncio.run(scenario())
        self.assertEqual(len(first_replies), 1)
        self.assertEqual(second_replies, [])
        self.assertEqual(wrong_replies, [])
        self.assertEqual(game["player_round_rolls"], 0)

    def test_one_hundred_players_in_one_chat_use_independent_roll_locks(self):
        async def scenario():
            original_games = {
                str(index): main.active_games.get(str(index))
                for index in range(100)
            }
            main._animated_roll_locks.clear()
            running = 0
            max_running = 0

            for index in range(100):
                main.active_games[str(index)] = {
                    "_created_at": time.time(),
                    "type": "sports_bowling_bot",
                    "game_name": "bowling",
                }

            async def fake_locked(update, context):
                nonlocal running, max_running
                running += 1
                max_running = max(max_running, running)
                await asyncio.sleep(0)
                running -= 1

            updates = [
                SimpleNamespace(
                    message=SimpleNamespace(
                        chat_id=777,
                        from_user=SimpleNamespace(id=str(index)),
                        dice=SimpleNamespace(value=4, emoji="🎳"),
                    )
                )
                for index in range(100)
            ]
            try:
                with patch.object(main, "_handle_dice_message_locked", side_effect=fake_locked):
                    await asyncio.gather(
                        *(main.handle_dice_message(update, None) for update in updates)
                    )
                return max_running
            finally:
                main._animated_roll_locks.clear()
                for user_id, previous in original_games.items():
                    if previous is None:
                        main.active_games.pop(user_id, None)
                    else:
                        main.active_games[user_id] = previous

        max_running = asyncio.run(scenario())
        self.assertGreater(
            max_running,
            1,
            "one player's roll must not become a global bottleneck",
        )


if __name__ == "__main__":
    unittest.main()