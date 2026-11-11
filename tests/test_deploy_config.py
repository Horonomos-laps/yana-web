"""Checks that the deploy configuration still points at files that exist.

Vercel and Cloudflare deploy this repository through their Git integrations, so a wrong path in
wrangler.jsonc or vercel.json only shows up after a deploy fails. These tests read the configs and
confirm every file they name is present.
"""
import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
REQUIRED_SECURITY_HEADERS = ("X-Content-Type-Options", "X-Frame-Options", "Content-Security-Policy")


def load_jsonc(path: Path) -> dict:
    """Parse JSON that may contain whole-line // comments."""
    text = "\n".join(
        line for line in path.read_text(encoding="utf-8").splitlines() if not line.strip().startswith("//")
    )
    return json.loads(re.sub(r",(\s*[}\]])", r"\1", text))


class WranglerConfig(unittest.TestCase):
    def setUp(self) -> None:
        self.config = load_jsonc(ROOT / "wrangler.jsonc")

    def test_worker_entry_file_exists_and_exports_a_handler(self) -> None:
        entry = ROOT / self.config["main"]
        self.assertTrue(entry.is_file(), f"wrangler main {entry} is missing")
        self.assertRegex(entry.read_text(encoding="utf-8"), r"export\s+default", "worker has no default export")

    def test_static_assets_directory_exists_and_has_a_home_page(self) -> None:
        assets = ROOT / self.config["assets"]["directory"]
        self.assertTrue(assets.is_dir(), f"assets directory {assets} is missing")
        self.assertTrue((assets / "index.html").is_file(), "assets directory has no index.html")

    def test_compatibility_date_is_a_calendar_date(self) -> None:
        self.assertRegex(self.config["compatibility_date"], r"^\d{4}-\d{2}-\d{2}$")


class VercelConfig(unittest.TestCase):
    def setUp(self) -> None:
        self.config = load_jsonc(ROOT / "vercel.json")

    def test_rewrite_destinations_exist_in_docs(self) -> None:
        missing = []
        for rule in self.config.get("rewrites", []):
            destination = rule["destination"].split("?")[0].lstrip("/")
            if destination and not (DOCS / destination).exists():
                missing.append(f'{rule["source"]} -> {rule["destination"]}')
        self.assertEqual(missing, [], "rewrites to files that do not exist:\n" + "\n".join(missing))

    def test_build_skip_command_watches_directories_that_exist(self) -> None:
        # ignoreCommand compares ':/docs' and ':/vercel.json'; if either path moves, Vercel stops rebuilding.
        command = self.config.get("ignoreCommand", "")
        for watched in re.findall(r"':/([^']+)'", command):
            self.assertTrue((ROOT / watched).exists(), f"ignoreCommand watches missing path {watched}")

    def test_security_headers_are_still_sent(self) -> None:
        names = {
            header["key"]
            for rule in self.config.get("headers", [])
            for header in rule.get("headers", [])
        }
        for required in REQUIRED_SECURITY_HEADERS:
            self.assertIn(required, names, f"{required} header was removed from vercel.json")


if __name__ == "__main__":
    unittest.main()
