"""Every local link and asset reference in the website pages must point at a file that exists.

The pages are served straight from docs/ by Vercel and Cloudflare. A moved or missing file only
shows up as a 404 for a visitor, so this walks all pages and resolves each relative reference.
"""
import json
import unittest
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
REFERENCE_ATTRIBUTES = {"href", "src"}
EXTERNAL_PREFIXES = ("http://", "https://", "//", "mailto:", "tel:", "javascript:", "data:", "#", "blob:", "about:")
MIN_PAGES = 50  # the site has about 95 pages; fewer means DOCS points at the wrong place


class ReferenceCollector(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.references: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        for name, value in attrs:
            if name in REFERENCE_ATTRIBUTES and value:
                self.references.append(value.strip())


def rewrite_sources() -> set[str]:
    config = json.loads((ROOT / "vercel.json").read_text(encoding="utf-8"))
    return {rule["source"].lstrip("/") for rule in config.get("rewrites", [])}


def target_exists(page: Path, reference: str, rewrites: set[str]) -> bool:
    path = unquote(urlsplit(reference).path)
    if not path:
        return True
    base = DOCS if path.startswith("/") else page.parent
    target = (base / path.lstrip("/")).resolve()
    if target.is_file():
        return True
    if target.is_dir() and (target / "index.html").is_file():
        return True
    if Path(str(target) + ".html").is_file():
        return True
    return path.lstrip("/") in rewrites


class LocalLinks(unittest.TestCase):
    def test_every_page_reference_resolves(self) -> None:
        pages = sorted(DOCS.glob("*.html"))
        self.assertGreater(len(pages), MIN_PAGES)
        rewrites = rewrite_sources()
        broken = []
        for page in pages:
            collector = ReferenceCollector()
            collector.feed(page.read_text(encoding="utf-8", errors="replace"))
            for reference in collector.references:
                if reference.startswith(EXTERNAL_PREFIXES):
                    continue
                if not target_exists(page, reference, rewrites):
                    broken.append(f"{page.name}: {reference}")
        self.assertEqual(broken, [], f"{len(broken)} broken local references:\n" + "\n".join(broken[:40]))


if __name__ == "__main__":
    unittest.main()
