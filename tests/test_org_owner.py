"""The GitHub owner in repository URLs must be the same everywhere, and the old owner must not return.

The repositories moved from the yanacuti1121 account to the Horonomos-laps organization. The
release lookup on the download page once compared release links against the old owner, so every
link silently fell back to a generic page after the move. These tests pin the owner and check that
the places which each repeat it agree with each other.
"""
import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OWNER = "Horonomos-laps"
OLD_OWNER = "yanacuti1121"
SKIP_DIRS = {".git", "node_modules", "dist", "build", "__pycache__"}
OLD_OWNER_URL = re.compile(rf"github\.com/{OLD_OWNER}/|repos/{OLD_OWNER}/")
# Files that still hold the old owner on purpose. Remove an entry when its file is changed.
KNOWN_PENDING = {
    "server.js": "HTTP-Referer header; file is held by the code-quality gate until a decision",
    "docs/demo.cast": "recorded terminal session, not edited by hand",
}
UPDATES_SCRIPT = ROOT / "docs" / "assets" / "yana-updates.js"


def text_files() -> list[Path]:
    found = []
    for path in ROOT.rglob("*"):
        if not path.is_file() or SKIP_DIRS.intersection(path.relative_to(ROOT).parts):
            continue
        if path.suffix in {".png", ".jpg", ".jpeg", ".gif", ".ico", ".woff", ".woff2", ".mp4", ".mov", ".webp", ".lock"}:
            continue
        found.append(path)
    return found


class OrgOwner(unittest.TestCase):
    def test_old_owner_does_not_appear_in_repository_urls(self) -> None:
        offenders = []
        for path in text_files():
            relative = path.relative_to(ROOT).as_posix()
            if relative in KNOWN_PENDING:
                continue
            try:
                text = path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                continue
            if OLD_OWNER_URL.search(text):
                offenders.append(relative)
        self.assertEqual(offenders, [], f"files that still use the old owner {OLD_OWNER}:\n" + "\n".join(offenders[:30]))

    def test_known_pending_entries_still_need_to_be_there(self) -> None:
        # An entry that no longer contains the old owner is stale and should be deleted.
        for relative in KNOWN_PENDING:
            text = (ROOT / relative).read_text(encoding="utf-8")
            self.assertRegex(text, OLD_OWNER_URL, f"{relative} no longer uses the old owner; drop it from KNOWN_PENDING")

    def test_release_lookup_uses_one_owner_in_all_three_places(self) -> None:
        source = UPDATES_SCRIPT.read_text(encoding="utf-8")
        fallback = re.search(r"github\.com/([A-Za-z0-9-]+)/\$\{project\.repo\}/releases`", source)
        api = re.search(r"api\.github\.com/repos/([A-Za-z0-9-]+)/\$\{project\.repo\}", source)
        path_check = re.search(r"startsWith\(`/([A-Za-z0-9-]+)/\$\{project\.repo\.toLowerCase\(\)\}/releases/`\)", source)
        for label, found in (("fallback URL", fallback), ("API URL", api), ("path check", path_check)):
            self.assertIsNotNone(found, f"yana-updates.js: could not find the {label}")
        owners = {fallback.group(1).lower(), api.group(1).lower(), path_check.group(1).lower()}
        self.assertEqual(owners, {OWNER.lower()}, f"owners disagree in yana-updates.js: {owners}")

    def test_electron_updater_owner_matches_the_repository_url(self) -> None:
        package = json.loads((ROOT / "yana-desktop" / "package.json").read_text(encoding="utf-8"))
        publish = package["build"]["publish"]
        publish = publish[0] if isinstance(publish, list) else publish
        self.assertEqual(publish["owner"], OWNER)
        self.assertIn(f"github.com/{OWNER}/", package["repository"]["url"])

    def test_website_numbers_workflow_checks_out_the_new_owner(self) -> None:
        workflow = (ROOT / ".github" / "workflows" / "website-numbers.yml").read_text(encoding="utf-8")
        self.assertRegex(workflow, rf"repository:\s*{OWNER}/Yana-AI")


if __name__ == "__main__":
    unittest.main()
