import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("nbis_fetch", ROOT / "scripts/fetch/fetch-nbis.py")
fetcher = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fetcher)


class FetchSafetyTests(unittest.TestCase):
    def test_strict_requires_sec_identity_before_provider_access(self):
        with patch.dict(os.environ, {"NBIS_STRICT": "1", "SEC_CONTACT_EMAIL": "", "SEC_USER_AGENT": ""}), patch.object(fetcher.yf, "Ticker") as ticker:
            with self.assertRaisesRegex(ValueError, "requires SEC"):
                fetcher.build_payload()
            ticker.assert_not_called()

    def test_invalid_snapshot_does_not_replace_existing_file(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "nbis.json"
            output.write_text('{"previous":true}', encoding="utf-8")
            with patch.object(fetcher, "OUT", output), patch.object(fetcher, "build_payload", return_value={"status": "ok"}), patch.dict(os.environ, {"NBIS_STRICT": "1"}):
                with self.assertRaises(ValueError):
                    fetcher.main()
            self.assertEqual(json.loads(output.read_text()), {"previous": True})


if __name__ == "__main__":
    unittest.main()
