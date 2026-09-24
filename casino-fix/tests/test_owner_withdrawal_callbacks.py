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


if __name__ == "__main__":
    unittest.main()