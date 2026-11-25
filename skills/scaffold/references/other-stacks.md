# Other stacks

These stacks have no dedicated reference yet. Work out their conventions in this order, which mirrors the precedence in `naming.md`:

1. **The language's official generator**, if it has one. Its output is the de facto standard layout.
2. **The official layout or style documentation.** Prefer this to popular-but-unofficial template repositories.
3. **The universal rules in `naming.md`**, for anything still open.

Say in the proposal which source you followed, so the user can judge it.

## Go

Start with `go mod init <module-path>`. The module path is usually the repository URL, such as `github.com/acme/csv-tidy`.

- **Package names** are a single short lowercase word, with no underscores or mixed caps. The directory name matches the package name.
- **File names** use `snake_case.go`. Tests sit beside the code as `*_test.go`, because the toolchain requires it.
- **Multiple binaries** go under `cmd/<binary-name>/main.go`.
- **`internal/`** holds code that other modules must not import. The compiler enforces this, which makes it the one layout folder with real teeth.
- **Official guidance** is at go.dev/doc/modules/layout. The widely starred `golang-standards/project-layout` repository is not official, and its `pkg/` folder in particular is contested. Don't add `pkg/` unless the repo already uses it.

## Rust

Start with `cargo new <name>` for a binary or `cargo new --lib <name>` for a library.

- **Crate names** may use hyphens in `Cargo.toml`; Cargo converts them to underscores for the crate name in code. Use kebab-case for the package and expect `snake_case` in `use` statements.
- **Standard folders** are `src/main.rs` or `src/lib.rs`, plus `tests/` for integration tests, `examples/` and `benches/`. Cargo discovers each of these automatically.
- **Workspaces** commonly keep member crates under `crates/`.
