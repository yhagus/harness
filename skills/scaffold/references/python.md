# Python

## Names

**Distribution name.** This is the `[project] name` in `pyproject.toml`, and what people `pip install`. Use kebab-case: `csv-tidy`.

**Import name.** This is the package directory. Use the same words in snake_case: `csv_tidy`. A hyphen is not valid in an identifier (`import csv-tidy` is a syntax error), and people expect `pip install csv-tidy` to give them `import csv_tidy`. PEP 8 prefers short package names without underscores. Take that as a reason to keep the project name short, not as a reason to make the import name differ from it.

**Modules.** Use short `snake_case.py` names.

**Don't shadow the standard library or popular packages at the top level.** Avoid names like `logging.py`, `json.py`, `test.py`, `email/` or `requests/`. A top-level module with one of these names quietly replaces the real one on import, which produces baffling errors. The checker warns about standard-library names.

## Library or CLI: use the src layout

```
csv-tidy/
├── pyproject.toml
├── README.md
├── .gitignore
├── src/
│   └── csv_tidy/
│       ├── __init__.py
│       └── cli.py          # CLI only
└── tests/
    └── test_cli.py
```

The `src/` folder keeps the package from being importable just because you're standing in the project root. That means tests run against the installed package (`pip install -e .` or `uv sync`), so packaging mistakes like a missing module or a wrong package config show up in tests instead of after release. The PyPA packaging guide discusses this trade-off.

A flat layout, with the package directly at the root, is fine for small apps and scripts that are never installed. If the existing repo uses a flat layout, follow it.

### `pyproject.toml`

- Use the `[project]` table (PEP 621) and a `[build-system]`. Hatchling is a simple default backend; keep whatever the repo already uses.
- Don't create `setup.py` or `setup.cfg` for new projects.
- For a CLI, add an entry point whose command name matches the distribution name:

  ```toml
  [project.scripts]
  csv-tidy = "csv_tidy.cli:main"
  ```

- Add `__main__.py` only if `python -m csv_tidy` should also work.

### Type hints

If the library ships type hints, add an empty `py.typed` file inside the package (PEP 561) so that type checkers use them.

### Tests

Put tests in a top-level `tests/` folder and name the files `test_*.py`. Mirror the source path, so `src/csv_tidy/io/reader.py` is tested by `tests/io/test_reader.py`. One trivial passing test is enough to start.

### `.gitignore`

At minimum, ignore:

- `__pycache__/` and `*.py[cod]`
- `.venv/`
- `dist/`, `build/` and `*.egg-info/`
- `.pytest_cache/`, `.mypy_cache/` and `.ruff_cache/`

## Applications and frameworks

### Django

Use `django-admin startproject <name>`, and create apps with `python manage.py startapp <app>`. Both names must be valid identifiers, so use snake_case. Don't hand-roll this structure.

### FastAPI, Flask and other services

Use the same src layout. Once there are more than a handful of modules, organize inside the package by feature (`users/`, `billing/`) rather than by technical layer (`models/`, `views/`, `services/`). Feature folders keep the files that change together in one place. This is a common default rather than a rule, so follow the repo where it has already chosen.

### Data and notebook projects

Put raw inputs in `data/raw/` and never edit them. Derived data goes in `data/processed/`, notebooks in `notebooks/`, and reusable code in a package. Cookiecutter Data Science is the well-known fuller version if the user wants it. Name notebooks so they sort in order and say who made them: `01-ab-initial-exploration.ipynb`.

## Adding a module to an existing Python repo

- Find the package root: the directory containing `__init__.py`, under `src/` or at the repo root.
- Create a new subpackage as a folder with `__init__.py`. Mirror what sibling `__init__.py` files re-export, which is often nothing.
- Place the tests where sibling tests live.
