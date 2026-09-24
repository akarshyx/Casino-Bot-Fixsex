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
        self.assertEqual(double.text, "×2 Double")
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

    def test_balance_buttons_use_custom_icons_without_duplicate_state_emoji(self):
        balance_text, markup = main._build_balance_view("emoji-ui-test")
        buttons = [button for row in markup.inline_keyboard for button in row]

        self.assertIn(f'emoji-id="{main.WALLET_EMOJI_ID}"', balance_text)
        self.assertEqual([button.text for button in buttons], ["Deposit", "Withdraw", "Coin balance"])
        self.assertNotIn("💸", "".join(button.text for button in buttons))
        self.assertTrue(all(button.to_dict().get("icon_custom_emoji_id") for button in buttons))


if __name__ == "__main__":
    unittest.main()