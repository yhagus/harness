#!/usr/bin/env python3
"""Check a directory tree against the scaffold skill's naming conventions.

Usage:
    python check_layout.py PATH [--project] [--stack python|typescript]

  --project   PATH is the root of a new project: also check the root files.
  --stack     Turn on stack-specific checks. Detected from manifests if omitted.

Errors are things that break tools or platforms (an unimportable Python
package, two names that collide on macOS). Warnings are usually wrong but
sometimes deliberate (a camelCase folder that matches its siblings).
Exit code is 1 if there are any errors, 0 otherwise.
"""
import argparse
import json
import re
import sys
from pathlib import Path

SKIP_DIRS = {
    ".git", "node_modules", ".venv", "venv", "env", "__pycache__", "dist", "build",
    "target", "coverage", ".next", ".astro", ".tox", ".pytest_cache",
    ".mypy_cache", ".ruff_cache", ".idea", ".turbo",
}
# Letters, digits and . _ - plus the routing syntax some frameworks use
# in folder names: [id], (group), @slot, +page.
SAFE_NAME = re.compile(r"^[A-Za-z0-9._\-\[\]()@+]+$")
ROOT_DOC_NAMES = {"readme.md": "README.md", "license": "LICENSE",
                  "changelog.md": "CHANGELOG.md", "contributing.md": "CONTRIBUTING.md"}
STDLIB = set(getattr(sys, "stdlib_module_names", ())) - {"__future__"}


class Report:
    def __init__(self, root):
        self.root = root
        self.items = []

    def add(self, level, path, msg):
        rel = path.relative_to(self.root) if path != self.root else Path(".")
        self.items.append((level, str(rel), msg))

    def errors(self):
        return [i for i in self.items if i[0] == "ERROR"]


def detect_stack(root):
    if (root / "pyproject.toml").exists() or (root / "setup.py").exists():
        return "python"
    if (root / "package.json").exists():
        return "typescript"
    # A module inside a repo: look upward for the manifest.
    for parent in root.parents:
        if (parent / "pyproject.toml").exists():
            return "python"
        if (parent / "package.json").exists():
            return "typescript"
    return None


def walk(root):
    """Yield (dir, subdirs, files) for every directory not in SKIP_DIRS."""
    stack = [root]
    while stack:
        d = stack.pop()
        entries = sorted(d.iterdir(), key=lambda p: p.name)
        subdirs = [e for e in entries if e.is_dir() and e.name not in SKIP_DIRS]
        files = [e for e in entries if e.is_file()]
        yield d, subdirs, files
        stack.extend(reversed(subdirs))


def check_generic(rep, d, subdirs, files):
    names = [p.name for p in subdirs + files]
    seen = {}
    for n in names:
        seen.setdefault(n.lower(), []).append(n)
    for group in seen.values():
        if len(group) > 1:
            rep.add("ERROR", d, f"names differ only by case: {', '.join(group)} "
                    "(these collide on macOS and Windows)")
    for p in subdirs + files:
        if re.search(r"\s", p.name):
            rep.add("ERROR", p, "name contains whitespace")
        elif not SAFE_NAME.match(p.name):
            rep.add("WARN", p, "name has characters outside A-Za-z0-9._-")
    for p in subdirs:
        if p.name.startswith((".", "[", "(", "@")):
            continue
        if any(c.isupper() for c in p.name):
            rep.add("WARN", p, "directory name has uppercase letters "
                    "(fine only if it matches the repo's existing convention)")
        if not any(p.iterdir()):
            rep.add("WARN", p, "empty directory (git won't track it)")


def check_python(rep, d, subdirs, files, root):
    is_package = (d / "__init__.py").exists()
    if is_package and not d.name.isidentifier():
        rep.add("ERROR", d, f"package folder '{d.name}' is not importable "
                f"(try '{re.sub(r'[^0-9A-Za-z_]', '_', d.name).lower()}')")
    for f in files:
        if f.suffix != ".py":
            continue
        if is_package and not f.stem.isidentifier():
            rep.add("ERROR", f, "module name is not a valid identifier, so it can't be imported")
        if d.name == "tests" and f.stem.startswith("test") and not (
                f.stem.startswith("test_") or f.stem == "tests"):
            rep.add("WARN", f, "pytest only collects test_*.py by default")
    # Top-level names that would shadow the standard library.
    if d == root or d.name == "src":
        for p in subdirs + files:
            stem = p.stem if p.is_file() else p.name
            if (p.is_dir() or p.suffix == ".py") and stem in STDLIB:
                rep.add("WARN", p, f"'{stem}' shadows a standard-library module")


def check_typescript(rep, root):
    for pkg in root.rglob("package.json"):
        if any(part in SKIP_DIRS for part in pkg.relative_to(root).parts):
            continue
        try:
            name = json.loads(pkg.read_text()).get("name")
        except (json.JSONDecodeError, UnicodeDecodeError):
            rep.add("ERROR", pkg, "package.json is not valid JSON")
            continue
        if name is None:
            continue
        if name != name.lower() or re.search(r"\s", name):
            rep.add("ERROR", pkg, f"package name '{name}' must be lowercase with no spaces")
        bare = name.split("/")[-1]
        if pkg.parent != root and not name.startswith("@") and bare != pkg.parent.name:
            rep.add("WARN", pkg, f"package name '{name}' differs from its folder '{pkg.parent.name}'")


def check_project_root(rep, root, stack):
    lower = {p.name.lower(): p for p in root.iterdir()}
    for low, proper in ROOT_DOC_NAMES.items():
        if low in lower and lower[low].name != proper:
            rep.add("WARN", lower[low], f"conventionally named '{proper}'")
    if "readme.md" not in lower:
        rep.add("ERROR", root, "missing README.md")
    if ".gitignore" not in lower:
        rep.add("ERROR", root, "missing .gitignore")
    if stack == "python":
        if not (root / "pyproject.toml").exists():
            rep.add("ERROR", root, "missing pyproject.toml")
        if (root / "setup.py").exists():
            rep.add("WARN", root / "setup.py", "new projects use pyproject.toml only")
    if stack == "typescript" and not (root / "package.json").exists():
        rep.add("ERROR", root, "missing package.json")
    if root.name != root.name.lower() or re.search(r"[\s_]", root.name):
        rep.add("WARN", root, f"project folder '{root.name}' is not lowercase kebab-case")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("path")
    ap.add_argument("--project", action="store_true")
    ap.add_argument("--stack", choices=["python", "typescript"])
    args = ap.parse_args()

    root = Path(args.path).resolve()
    if not root.is_dir():
        sys.exit(f"not a directory: {root}")
    stack = args.stack or detect_stack(root)
    rep = Report(root)

    for d, subdirs, files in walk(root):
        check_generic(rep, d, subdirs, files)
        if stack == "python":
            check_python(rep, d, subdirs, files, root)
    if stack == "typescript":
        check_typescript(rep, root)
    if args.project:
        check_project_root(rep, root, stack)

    print(f"Checked {root} (stack: {stack or 'unknown'})")
    for level, path, msg in rep.items:
        print(f"{level:5} {path}: {msg}")
    n_err = len(rep.errors())
    print(f"{n_err} error(s), {len(rep.items) - n_err} warning(s)")
    sys.exit(1 if n_err else 0)


if __name__ == "__main__":
    main()
