import tempfile
import unittest
from io import BytesIO
from pathlib import Path
from unittest.mock import patch

import main
from PIL import Image


class BannerSettingsTests(unittest.TestCase):
    def test_banner_target_aliases(self):
        self.assertEqual(main._normalise_banner_target("menu"), "menu")
        self.assertEqual(main._normalise_banner_target("welcome"), "menu")
        self.assertEqual(main._normalise_banner_target("/PROFILE"), "profile")
        self.assertIsNone(main._normalise_banner_target("unknown"))

    def test_save_banner_replaces_target_atomically(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            destination = Path(temp_dir) / "menu.jpeg"
            image_buffer = BytesIO()
            Image.new("RGB", (1, 1), color="black").save(image_buffer, format="JPEG")
            with patch.dict(main.CASINO_UI_ASSETS, {"menu": str(destination)}, clear=False):
                saved_path = main._save_banner_bytes(
                    "welcome", image_buffer.getvalue(), "test-owner"
                )

            self.assertEqual(saved_path, str(destination))
            self.assertGreater(destination.stat().st_size, 0)
            self.assertFalse(list(destination.parent.glob("*.tmp.*")))


if __name__ == "__main__":
    unittest.main()