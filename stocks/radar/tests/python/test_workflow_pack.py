import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
import zipfile

SCRIPT = Path(__file__).resolve().parents[2] / "scripts/ops/package-workflow-pack.py"
spec = importlib.util.spec_from_file_location("workflow_pack", SCRIPT)
pack = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pack)


class WorkflowPackTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.metadata = self.root / "src/data/workflow-pack.json"
        self.metadata.parent.mkdir(parents=True)
        self.source = self.root / ".private-products/research-workflow-pack/1.0.0"
        self.source.mkdir(parents=True)
        self.write_metadata(["00-start-here.md", "01-evidence.md"])
        (self.source / "00-start-here.md").write_text("# Start\n", encoding="utf-8")
        (self.source / "01-evidence.md").write_text("# Evidence\n", encoding="utf-8")

    def tearDown(self):
        self.temp.cleanup()

    def write_metadata(self, names, version="1.0.0"):
        self.metadata.write_text(json.dumps({"name": "Test pack", "version": version, "files": [{"name": name} for name in names]}), encoding="utf-8")

    def test_archive_excludes_unlisted_files_and_has_valid_checksums(self):
        (self.source / "operator-notes.txt").write_text("not part of delivery", encoding="utf-8")
        output = pack.build_pack(self.root)
        self.assertTrue(output.is_relative_to(self.root / ".private-products"))
        with zipfile.ZipFile(output) as archive:
            self.assertIsNone(archive.testzip())
            prefix = "research-workflow-pack-1.0.0/"
            self.assertEqual(set(archive.namelist()), {prefix + name for name in ["00-start-here.md", "01-evidence.md", "manifest.json"]})
            manifest = json.loads(archive.read(prefix + "manifest.json"))
            for entry in manifest["files"]:
                content = archive.read(prefix + entry["name"])
                self.assertEqual(entry["sha256"], hashlib.sha256(content).hexdigest())
                self.assertEqual(entry["bytes"], len(content))

    def test_rebuild_is_deterministic_and_missing_source_preserves_previous_archive(self):
        output = pack.build_pack(self.root)
        original = output.read_bytes()
        self.assertEqual(pack.build_pack(self.root).read_bytes(), original)
        (self.source / "01-evidence.md").unlink()
        with self.assertRaisesRegex(ValueError, "Missing or unsafe"):
            pack.build_pack(self.root)
        self.assertEqual(output.read_bytes(), original)

    def test_rejects_paths_and_duplicate_entries(self):
        for names, version in [(["../outside.md"], "1.0.0"), (["00-start-here.md"] * 2, "1.0.0"), (["00-start-here.md"], "../outside")]:
            with self.subTest(names=names, version=version):
                self.write_metadata(names, version)
                with self.assertRaises(ValueError):
                    pack.build_pack(self.root)


if __name__ == "__main__":
    unittest.main()
