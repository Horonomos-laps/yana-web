"""Guards against paths left over from the old monorepo layout.

This code used to live in Yana-AI under tools/yana-web. A relative import that no longer
resolves is invisible to the other tests: worker.js imported ./tools/yana-web/lib/... and
CI stayed green because the worker test rewrote that exact string before loading the file.
These tests resolve every relative import and require against the real files.
"""
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKIP_DIRS = {".git", "node_modules", "dist", "build", "vendor", "__pycache__"}
SCRIPT_SUFFIXES = (".js", ".mjs", ".cjs", ".jsx")
RESOLVE_SUFFIXES = ("", ".js", ".mjs", ".cjs", ".jsx", ".json", ".css", ".node")
RELATIVE_SPEC = re.compile(
    r"""(?:require\(\s*|from\s+|import\s+|import\(\s*)['"](\.{1,2}/[^'"\n]*|\.{1,2})['"]"""
)
STALE_PREFIX = "tools/yana-"


def script_files() -> list[Path]:
    found = []
    for path in ROOT.rglob("*"):
        if path.suffix not in SCRIPT_SUFFIXES or not path.is_file():
            continue
        if SKIP_DIRS.intersection(path.relative_to(ROOT).parts):
            continue
        found.append(path)
    return sorted(found)


def code_lines(path: Path) -> list[tuple[int, str]]:
    """Return (line number, text) for lines that are not whole-line comments."""
    lines = []
    for number, line in enumerate(path.read_text(encoding="utf-8", errors="replace").splitlines(), 1):
        stripped = line.strip()
        if stripped.startswith(("//", "*", "/*")):
            continue
        lines.append((number, line))
    return lines


def resolves(base: Path, spec: str) -> bool:
    target = (base / spec).resolve()
    if any(Path(str(target) + suffix).is_file() for suffix in RESOLVE_SUFFIXES):
        return True
    return target.is_dir()


class StaleLayoutPaths(unittest.TestCase):
    def test_there_are_scripts_to_check(self) -> None:
        # Guards the guard: a wrong ROOT would make the other tests pass on an empty list.
        self.assertGreater(len(script_files()), 20)

    def test_relative_imports_resolve_inside_the_repository(self) -> None:
        broken = []
        for path in script_files():
            for number, line in code_lines(path):
                for match in RELATIVE_SPEC.finditer(line):
                    spec = match.group(1)
                    if not resolves(path.parent, spec):
                        broken.append(f"{path.relative_to(ROOT)}:{number} -> {spec}")
        self.assertEqual(broken, [], "relative imports that do not resolve:\n" + "\n".join(broken))

    def test_no_import_points_at_the_old_tools_directory(self) -> None:
        stale = []
        for path in script_files():
            for number, line in code_lines(path):
                for match in RELATIVE_SPEC.finditer(line):
                    if STALE_PREFIX in match.group(1):
                        stale.append(f"{path.relative_to(ROOT)}:{number} -> {match.group(1)}")
        self.assertEqual(stale, [], "imports that still use tools/yana-*:\n" + "\n".join(stale))


if __name__ == "__main__":
    unittest.main()
