## Commit messages
- Write every commit message in English, whatever language is used in the conversation, the prompt, Q&A, code comments, or the environment (locale, OS, tooling).
- Follow Conventional Commits: `<type>(<optional scope>): <summary>`, with type one of `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `style`, `build`, `ci`, `chore`, `revert`.
- Default to a one-line message: imperative mood, lowercase start, no trailing period, at most 72 characters.
- Add a body or footer only when the one line can't carry it: a breaking change (`BREAKING CHANGE: ...`) or a non-obvious why. Separate it with a blank line and wrap at 72.
- If the repo documents its own commit convention (CONTRIBUTING.md, commitlint config), follow that, but keep the message in English.

## Releases (release-writer)
- Release notes for every release, in any repo and on any git platform, come from the `release-writer` subagent. Spawn it before the release commit, briefed with the new version and the previous tag; it writes the changelog section and returns its text.
- The main thread does the rest around it, following the repo's release doc when one exists: version bump, checks, release commit, tag, push, and the platform release page (which reuses the section text the agent returned).
- To change the notes, send the requested change to a fresh `release-writer`; edit the section by hand only for a typo-sized fix.

## Pull / merge requests (pr-writer)
- The title and description of every pull request or merge request, in any repo and on any git platform, come from the `pr-writer` subagent. Spawn it once the branch is ready for review, briefed with the base branch, linked issues or tickets, and the evidence already in hand (test output, screenshots); it returns the title and body.
- The main thread does the rest around it: push, create or edit the PR/MR with the platform CLI (`gh`, `glab`, `tea`, ...) using the returned text, then reviewers, labels and draft status.
- To change the description, send the requested change to a fresh `pr-writer`; edit by hand only for a typo-sized fix.

## Parallel implementers
- Run implementer tickets in parallel only when they are independent:
  neither needs the other's output, and they don't change the same files.
- Tickets that change shared foundations (database schema or migrations, shared types, API contracts, config) run alone, before the tickets that depend on them.
- A stack-specific implementer cannot write to a shared layer (for example `layers/shared`). Make the shared-layer change in the main thread first, then send tickets that only use its contract.

## Write subagents (cost)
- Send implementation tickets to a stack-specific implementer (`nest-implementer`, `nuxt-implementer`, `react-implementer`, `vue-implementer`, `node-implementer` as fallback), never to `general-purpose` or `fork`. A fork carries the whole parent context into every turn.
- A stack-specific implementer (all but `node-implementer`) writes only inside its own app (the nearest `package.json` with its framework); a hook blocks the rest. In a monorepo, split a ticket that touches several apps into one ticket per app before dispatching, ordered by the "Parallel implementers" rules: the side that defines a shared contract (usually the backend API) goes first.
- A few-line edit a ticket forces in another app (a docs row, a mirror-list entry, a line another app's check reads) is a seam, not a ticket: the brief asks the implementer to report its exact text, and the main thread applies it right after merging that ticket.
- One agent per ticket, but fold tiny tickets that touch the same files into one agent. A change of a few lines is cheaper in the main thread than in a subagent.
- Brief an implementer with pointers so it doesn't explore: the ticket, `file:line` hits from Explore or codegraph, one or two existing files to imitate, and the test command.
- Follow-ups (review fixes, adjustments) go to a fresh agent with a pointer brief (ticket, commits), not to a long-running one: every turn re-reads its whole context.
- Run verification and code review once at the end, not after every ticket.

## Library docs (Context7)
- Use Context7 MCP automatically when you need third-party library/framework docs, setup or configuration steps, or APIs that may differ between versions.
- Check the installed version in package.json / requirements.txt / go.mod / composer.json first, then fetch docs for that version.
- Don't use it for basic language syntax, the standard library, or this project's own code.

<!-- CODEGRAPH_START -->
## CodeGraph

In repositories indexed by CodeGraph (a `.codegraph/` directory exists at the repo root), reach for it BEFORE grep/find or reading files when you need to understand or locate code:

- **MCP tool** (when available): `codegraph_explore` answers most code questions in one call — the relevant symbols' verbatim source plus the call paths between them, including dynamic-dispatch hops grep can't follow. Name a file or symbol in the query to read its current line-numbered source. If it's listed but deferred, load it by name via tool search.
- **Shell** (always works): `codegraph explore "<symbol names or question>"` prints the same output.

If there is no `.codegraph/` directory, skip CodeGraph entirely — indexing is the user's decision.
<!-- CODEGRAPH_END -->

## Code search (Explore)
- For read-only code location and exploration (where something is defined,
  used, configured or tested; which files handle a feature; every call site
  before an edit; context from tests or eval cases), use the `Explore`
  subagent, not `general-purpose`. It is overridden in
  `~/.claude/agents/Explore.md` to run on Haiku (effort high) with Read, Grep, Glob and
  Bash, and returns the answer plus file:line pointers. It cannot read
  tickets or other MCP sources.
- Fan out when a search has independent parts: split it into questions (one
  per symbol, layer, package or repo) and spawn one Explore per question, all
  in a single message. Don't split what one agent can answer, and skip the
  subagent when one or two tool calls answer it: if you already know the file,
  or a single Grep answers it, do it yourself.
- Give each Explore the repo path and one narrow question, and say what you
  already ruled out.
- In a repo with `.codegraph/`, try `codegraph_explore` first; send Explore
  for what it doesn't answer.
- When you already know which file or function you need and want its
  exact content, read it directly.

@RTK.md
