"""Package only the allowlisted, locally held Workflow Pack files. Never publish them."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import re
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[2]


def build_pack(root: Path = ROOT) -> Path:
    root = root.resolve()
    metadata = json.loads((root / "src/data/workflow-pack.json").read_text(encoding="utf-8"))
    version = metadata["version"]
    if not isinstance(version, str) or not re.fullmatch(r"\d+\.\d+\.\d+", version):
        raise ValueError("Product version must be a numeric major.minor.patch version")
    private = (root / ".private-products").resolve()
    if not private.is_relative_to(root):
        raise ValueError("Private product directory must stay inside the project")
    source = (private / "research-workflow-pack" / version).resolve()
    if not source.is_relative_to(private):
        raise ValueError("Product source directory must stay inside .private-products")
    names = [entry["name"] for entry in metadata["files"]]
    if not names or len(names) != len(set(names)):
        raise ValueError("Product manifest must contain a nonempty list of unique files")

    files: dict[str, bytes] = {}
    for name in names:
        if not isinstance(name, str) or not re.fullmatch(r"\d{2}-[a-z0-9-]+\.md", name):
            raise ValueError(f"Invalid product file name: {name!r}")
        path = (source / name).resolve()
        if not path.is_relative_to(source) or not path.is_file():
            raise ValueError(f"Missing or unsafe product file: {name}")
        content = path.read_text(encoding="utf-8").replace("\r\n", "\n")
        if not content.strip():
            raise ValueError(f"Empty product file: {name}")
        files[name] = content.encode("utf-8")

    manifest = {
        "product": metadata["name"],
        "version": version,
        "files": [
            {"name": name, "bytes": len(content), "sha256": hashlib.sha256(content).hexdigest()}
            for name, content in files.items()
        ],
    }
    files["manifest.json"] = (json.dumps(manifest, indent=2) + "\n").encode("utf-8")
    output_dir = (private / "releases").resolve()
    if not output_dir.is_relative_to(private):
        raise ValueError("Release directory must stay inside .private-products")
    output_dir.mkdir(parents=True, exist_ok=True)
    output = output_dir / f"stockswatch-research-workflow-pack-{version}.zip"
    if output.is_symlink():
        raise ValueError("Release target must not be a symbolic link")
    with tempfile.NamedTemporaryFile(dir=output_dir, prefix="workflow-pack-", suffix=".tmp", delete=False) as handle:
        temporary = Path(handle.name)
    try:
        with zipfile.ZipFile(temporary, "w") as archive:
            for name, content in files.items():
                # Stable metadata makes identical source files produce identical archives.
                info = zipfile.ZipInfo(f"research-workflow-pack-{version}/{name}", date_time=(1980, 1, 1, 0, 0, 0))
                info.compress_type = zipfile.ZIP_DEFLATED
                info.create_system = 3
                info.external_attr = 0o100644 << 16
                archive.writestr(info, content)
        os.replace(temporary, output)
    finally:
        temporary.unlink(missing_ok=True)
    return output


if __name__ == "__main__":
    result = build_pack()
    print(f"Packaged private Workflow Pack: {result}")
    print("Not published. Upload only through the selected checkout's protected delivery flow.")
