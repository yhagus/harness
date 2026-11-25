import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";

const DIRECTIVE = new RegExp(
  [
    String.raw`^@ts-(?:expect-error|ignore|nocheck|check)\b`,
    String.raw`^(?:eslint|oxlint|biome|stylelint|prettier|deno-lint|jshint|jscs|global)\b`,
    String.raw`^(?:biome|prettier|deno-lint)-ignore`,
    String.raw`^(?:istanbul|c8|v8|node:coverage)\s+(?:ignore|disable|enable)`,
    String.raw`^@vue-(?:ignore|expect-error|skip)\b`,
    String.raw`^[#@]__(?:PURE|NO_SIDE_EFFECTS|INLINE|NOINLINE)__`,
    String.raw`^(?:webpack[A-Z]\w*|@vite-ignore)\b`,
    String.raw`^@jsx(?:ImportSource|Runtime|Frag)?\b`,
    String.raw`^\/\s*<(?:reference|amd-module|amd-dependency)\b`,
    String.raw`^[#@]\s*source(?:Mapping)?URL=`,
    String.raw`^!`,
    String.raw`@(?:license|preserve)\b`,
  ].join("|"),
);

const JSDOC_TYPES = /@(?:type|typedef|param|returns?|template|satisfies|import|callback|enum|implements|extends|this)\b/;
const PLAIN_JS = /\.[cm]?jsx?$/;

export function isFunctional(value, filename, allow) {
  const trimmed = value.replace(/^[\s*]+/, "");
  if (DIRECTIVE.test(trimmed)) return true;
  if (PLAIN_JS.test(filename) && value.startsWith("*") && JSDOC_TYPES.test(value)) return true;
  return allow ? allow.test(value) : false;
}

const baselines = new Map();

function loadBaseline(path) {
  if (!baselines.has(path)) {
    baselines.set(path, existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : {});
  }
  return baselines.get(path);
}

const noComments = {
  meta: {
    type: "suggestion",
    docs: { description: "Bans code comments, ratcheted down per file by a baseline." },
    schema: [
      {
        type: "object",
        properties: {
          baseline: { type: "string" },
          allow: { type: "string" },
          adr: { type: "string" },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const options = context.options[0] ?? {};
    const root = context.cwd ?? process.cwd();
    const counting = process.env.COMMENT_BASELINE === "off";
    const baseline = options.baseline && !counting ? loadBaseline(resolve(root, options.baseline)) : {};
    const allow = options.allow ? new RegExp(options.allow) : undefined;
    const filename = context.filename ?? context.getFilename();
    const file = (isAbsolute(filename) ? relative(root, filename) : filename).split(sep).join("/");
    const see = options.adr ? ` (${options.adr})` : "";
    return {
      Program(program) {
        const sourceCode = context.sourceCode ?? context.getSourceCode();
        const comments = sourceCode.getAllComments().filter((comment) => !isFunctional(comment.value, file, allow));
        const allowed = baseline[file] ?? 0;
        if (comments.length > allowed) {
          const message =
            allowed === 0
              ? `Comments are banned: name things so the code explains itself, and record decisions as ADRs${see}.`
              : `This file has ${comments.length} comments and ${options.baseline} allows ${allowed}: delete comments, never add them${see}.`;
          for (const comment of comments) {
            context.report({ loc: comment.loc, message });
          }
        } else if (comments.length < allowed) {
          context.report({
            node: program,
            message: `This file has ${comments.length} comments but ${options.baseline} still allows ${allowed}: run the comment baseline script to ratchet it down${see}.`,
          });
        }
      },
    };
  },
};

export default {
  meta: { name: "comments" },
  rules: { "no-comments": noComments },
};
