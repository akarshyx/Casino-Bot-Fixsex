import unittest

import main


class EmojiUiTests(unittest.TestCase):
    def test_main_menu_uses_custom_icons_without_unicode_prefixes(self):
        markup = main._main_menu_keyboard("emoji-ui-test")
        buttons = [button for row in markup.inline_keyboard for button in row]
        labels = [button.text for button in buttons]

        self.assertEqual(
            labels,
            ["Stuck Deposits", "Games", "Deposit", "Withdraw", "Refer and Earn", "Settings"],
        )
        self.assertTrue(all(button.to_dict().get("icon_custom_emoji_id") for button in buttons))

    def test_post_round_actions_use_blackjack_pack_icons_and_keep_callbacks(self):
        markup = main._rc_end_keyboard("dice", "1d6", 10.0, "h")
        repeat, double = markup.inline_keyboard[0]
        change_mode = markup.inline_keyboard[1][0]

        self.assertEqual(repeat.text, "Repeat")
        self.assertEqual(double.text, "Double")
        self.assertEqual(change_mode.text, "Change mode")
        self.assertEqual(repeat.callback_data, "dice_repeat_1d6_10.0_h")
        self.assertEqual(double.callback_data, "dice_double_1d6_10.0_h")
        self.assertEqual(change_mode.callback_data, "dice_changemode_10.0")
        self.assertEqual(
            repeat.to_dict()["icon_custom_emoji_id"],
            main._BJ_BUTTON_EMOJI_IDS["replay"],
        )
        self.assertEqual(
            double.to_dict()["icon_custom_emoji_id"],
            main._BJ_BUTTON_EMOJI_IDS["double"],
        )
        self.assertEqual(
            change_mode.to_dict()["icon_custom_emoji_id"],
            main._BJ_BUTTON_EMOJI_IDS["card_back"],
        )

    def test_blackjack_controls_use_all_action_stickers_from_pack(self):
        active = main._bj_buttons("emoji-ui-test", can_double=True)
        hit, stand, double = active.inline_keyboard[0]
        self.assertEqual([hit.text, stand.text, double.text], ["Hit", "Stand", "Double"])
        self.assertEqual(hit.to_dict()["icon_custom_emoji_id"], main._BJ_BUTTON_EMOJI_IDS["hit"])
        self.assertEqual(stand.to_dict()["icon_custom_emoji_id"], main._BJ_BUTTON_EMOJI_IDS["stand"])
        self.assertEqual(double.to_dict()["icon_custom_emoji_id"], main._BJ_BUTTON_EMOJI_IDS["double"])

        postgame = main._bj_postgame_buttons("emoji-ui-test")
        play_again = postgame.inline_keyboard[0][0]
        double_bet = postgame.inline_keyboard[1][2]
        change_bet = postgame.inline_keyboard[2][0]
        self.assertEqual(play_again.to_dict()["icon_custom_emoji_id"], main._BJ_BUTTON_EMOJI_IDS["replay"])
        self.assertEqual(double_bet.to_dict()["icon_custom_emoji_id"], main._BJ_BUTTON_EMOJI_IDS["double"])
        self.assertEqual(change_bet.text, "Change bet")
        self.assertEqual(change_bet.to_dict()["icon_custom_emoji_id"], main._BJ_BUTTON_EMOJI_IDS["card_back"])
        self.assertNotIn("📝", change_bet.text)

    def test_blackjack_message_has_pack_cards_without_general_casino_emojis(self):
        text = main._bj_render(
            "emoji-ui-test",
            [("A", "♠"), ("7", "♣")],
            [("9", "♥"), ("K", "♦")],
            "$20.00",
            "$100.00",
            "playing",
        )

        self.assertIn(f'emoji-id="{main._BJ_RANK_EMOJI["A"]}"', text)
        self.assertIn(f'emoji-id="{main._BJ_RANK_EMOJI["7"]}"', text)
        self.assertIn(f'emoji-id="{main._BJ_HEADER_EMOJI_ID}"', text)
        self.assertNotIn("💵", text)
        self.assertNotIn("✅", text)
        self.assertNotIn("❌", text)
        self.assertNotIn("🤝", text)

        rendered, kwargs = main._bj_message_payload(text, {"parse_mode": "HTML"})
        self.assertIn("💳", rendered)
        custom_ids = [
            entity.custom_emoji_id
            for entity in kwargs["entities"]
            if entity.type == "custom_emoji"
        ]
        self.assertIn(main._BJ_RANK_EMOJI["A"], custom_ids)
        self.assertIn(main._BJ_RANK_EMOJI["7"], custom_ids)
        self.assertIn(main._BJ_RANK_EMOJI["9"], custom_ids)
        self.assertNotIn(main._BJ_RANK_EMOJI["K"], custom_ids)
        self.assertIn(main._BJ_HIDDEN_EMOJI_ID, custom_ids)
        self.assertEqual(kwargs["parse_mode"], None)
        self.assertNotIn("<tg-emoji", rendered)

    def test_blackjack_hidden_dealer_card_uses_one_pack_card_back(self):
        text = main._bj_render(
            "emoji-ui-test",
            [("A", "♠"), ("7", "♣")],
            [("9", "♥"), ("K", "♦")],
            "$20.00",
            "$100.00",
            "playing",
        )

        self.assertEqual(text.count(f'emoji-id="{main._BJ_HIDDEN_EMOJI_ID}"'), 3)
        # Two card-backs are the dealer/player headers and one is the hidden
        # dealer card. The suit row must not get a second hidden-card sticker.
        self.assertEqual(text.count("💳"), 3)

    def test_balance_buttons_use_custom_icons_without_duplicate_state_emoji(self):
        balance_text, markup = main._build_balance_view("emoji-ui-test")
        buttons = [button for row in markup.inline_keyboard for button in row]

        self.assertIn(f'emoji-id="{main.WALLET_EMOJI_ID}"', balance_text)
        self.assertEqual([button.text for button in buttons], ["Deposit", "Withdraw", "Coin balance"])
        self.assertNotIn("💸", "".join(button.text for button in buttons))
        self.assertTrue(all(button.to_dict().get("icon_custom_emoji_id") for button in buttons))


if __name__ == "__main__":
    unittest.main()