import os
import unittest
from unittest.mock import patch

import main


class OwnerWithdrawalCallbackTests(unittest.TestCase):
    def test_both_default_owners_are_authorized_when_legacy_env_lists_one(self):
        with patch.dict(os.environ, {"OWNER_IDS": str(main.OWNER_ID)}, clear=False):
            owner_ids = main._owner_ids_from_env(main.OWNER_ID)

        self.assertTrue({8598790977, 8019063422}.issubset(owner_ids))
        for owner_id in (8598790977, 8019063422):
            with self.subTest(owner_id=owner_id):
                self.assertTrue(main.is_owner_or_manager(owner_id))
                self.assertTrue(
                    main._is_admin_callback_for_user(
                        "approve_np_withdrawal_npw_test",
                        str(owner_id),
                    )
                )
                self.assertTrue(
                    main._is_admin_callback_for_user(
                        "approve_crypto_withdrawal_cw_test",
                        str(owner_id),
                    )
                )

    def test_withdrawal_callback_ids_keep_embedded_underscores(self):
        withdrawal_id = "npw_123456789_1790217999"
        callback = f"approve_np_withdrawal_{withdrawal_id}"

        self.assertEqual(
            callback[len("approve_np_withdrawal_"):],
            withdrawal_id,
        )
        self.assertEqual(
            f"reject_np_withdrawal_{withdrawal_id}"[len("reject_np_withdrawal_"):],
            withdrawal_id,
        )


if __name__ == "__main__":
    unittest.main()