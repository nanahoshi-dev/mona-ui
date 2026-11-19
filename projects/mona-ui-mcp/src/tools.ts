import { findSymbols, firstSentence, renderEntryPoint, renderSymbol } from "./api-render.js";
import type { DocsContext, SearchItem } from "./docs-context.js";
import type { DocsPage } from "./docs-data.js";
import { PACKAGE_NAME } from "./docs-data.js";
import { estimateTokens, findSection, renderOutline, splitProseAndCode } from "./markdown.js";
import { tokenize } from "./search.js";
import { suggest } from "./template-check.js";

/*
 * What each tool answers, as plain functions of the docs, so they can be tested without a transport. Answers are
 * markdown, and say which tool and arguments fetch more, since that's what an agent reads next.
 */

/** Pages up to this long come back whole; longer ones come back as their intro and an outline, unless asked in full. */
export const FULL_PAGE_LIMIT = 24_000;
const MAX_SECTIONS_PER_PAGE = 3;
const SNIPPET_LENGTH = 220;

export function listComponents(context: DocsContext, category?: string): string {
    const { manifest } = context.docs;
    const wanted = category?.trim().toLowerCase();
    const pages = wanted ? manifest.pages.filter(page => page.category.toLowerCase().includes(wanted)) : manifest.pages;
    const categories = [...new Set(manifest.pages.map(page => page.category))];
    if (pages.length === 0) {
        return `No category matches "${category}". The categories are: ${categories.join(", ")}.`;
    }
    const lines = [`# Mona UI ${manifest.version}`, ""];
    if (!wanted) {
        lines.push(manifest.essentials, "");
    }
    lines.push(
        "## Pages",
        "",
        'Read one with get_docs_page and its name in quotes, such as get_docs_page("button"). A page names the entry point to import from.',
        ""
    );
    for (const name of categories) {
        const inCategory = pages.filter(page => page.category === name);
        if (inCategory.length === 0) {
            continue;
        }
        lines.push(`### ${name}`, "");
        for (const page of inCategory) {
            const entryPoint = page.entryPoint ? `, \`${PACKAGE_NAME}/${page.entryPoint}\`` : "";
            lines.push(`- ${page.title} ("${page.slug}"${entryPoint}): ${page.description}`);
        }
        lines.push("");
    }
    if (!wanted) {
        const documented = new Set(manifest.pages.map(page => page.entryPoint));
        const others = context.docs.index.entryPoints
            .map(entryPoint => entryPoint.name)
            .filter(name => !documented.has(name));
        if (others.length > 0) {
            lines.push(
                `Entry points without a page of their own: ${others.join(", ")}. get_api with one of these names lists its exports.`
            );
        }
    }
    return lines.join("\n").trimEnd();
}

export function searchDocs(
    context: DocsContext,
    query: string,
    limit = 8,
    scope: "all" | "api" | "docs" = "all"
): string {
    const perPage = new Map<string, number>();
    const accept = (item: SearchItem): boolean => {
        if (scope === "api" && item.kind !== "symbol") {
            return false;
        }
        if (scope === "docs" && item.kind !== "section") {
            return false;
        }
        if (item.kind === "section") {
            const count = perPage.get(item.page.slug) ?? 0;
            if (count >= MAX_SECTIONS_PER_PAGE) {
                return false;
            }
            perPage.set(item.page.slug, count + 1);
        }
        return true;
    };
    const hits = context.search.search(query, limit, accept);
    if (hits.length === 0) {
        return `Nothing in the Mona UI ${context.docs.version} docs matches "${query}". Try other words, or list_components for everything there is.`;
    }
    const terms = tokenize(query);
    const lines = [`Results for "${query}" in the Mona UI ${context.docs.version} docs:`, ""];
    hits.forEach(({ item }, index) => {
        if (item.kind === "section") {
            const { page, section } = item;
            const title = pageLabel(page);
            const where = section.level === 1 ? title : [title, ...section.path].join(" › ");
            const fetch =
                section.level === 1
                    ? `get_docs_page("${page.slug}")`
                    : `get_docs_page("${page.slug}", section: "${section.heading}")`;
            const text = context.docs.pageMarkdown(page).slice(section.start, section.end);
            lines.push(`${index + 1}. ${where}: ${fetch}`, `   ${snippet(text, terms)}`);
        } else {
            const { entryPoint, symbol } = item.symbol;
            const usedBy = symbol.selector
                ? `, \`${symbol.selector}\``
                : symbol.pipeName
                  ? `, pipe \`${symbol.pipeName}\``
                  : "";
            const about =
                firstSentence(symbol.description) ||
                (symbol.page ? `Documented on the ${symbol.page.title} page.` : "No description.");
            lines.push(
                `${index + 1}. ${symbol.name} (${symbol.kind} from \`${PACKAGE_NAME}/${entryPoint}\`${usedBy}): get_api("${symbol.name}")`,
                `   ${about}`
            );
        }
    });
    return lines.join("\n");
}

export function getDocsPage(context: DocsContext, request: string, sectionRequest?: string, full = false): string {
    const page = context.findPage(request);
    if (!page) {
        const names = context.docs.manifest.pages.map(entry => entry.slug);
        return `No page is called "${request}".${suggest(request, names, '"', '"')} list_components lists every page.`;
    }
    const markdown = context.docs.pageMarkdown(page);
    const sections = context.sections(page);
    if (sectionRequest?.trim()) {
        const section = findSection(sections, sectionRequest);
        if (!section) {
            return `The ${page.title} page has no section "${sectionRequest}". Its sections:\n\n${renderOutline(sections)}`;
        }
        const heading = `# ${page.title} › ${section.path.join(" › ")}`;
        const entryPoint = page.entryPoint ? `\n\nEntry point: \`${PACKAGE_NAME}/${page.entryPoint}\`` : "";
        return `${heading}${entryPoint}\n\n${markdown.slice(section.start, section.endWithSubsections).trim()}`;
    }
    if (full || markdown.length <= FULL_PAGE_LIMIT) {
        return markdown.trim();
    }
    const intro = sections[0];
    return [
        markdown.slice(intro.start, intro.end).trim(),
        "",
        `## Sections`,
        "",
        `This page is long (~${estimateTokens(markdown.length)} tokens), so here is its outline. Read a section with ` +
            `get_docs_page("${page.slug}", section: "<heading>"), or pass full: true for all of it.`,
        "",
        renderOutline(sections)
    ].join("\n");
}

export function getApi(context: DocsContext, request: string): string {
    const name = request.trim().replace(/^@nanahoshi\/mona-ui\//, "");
    const entryPoint = context.docs.entryPoint(name.toLowerCase());
    if (entryPoint) {
        return renderEntryPoint(entryPoint);
    }
    const found = findSymbols(context.symbols, name);
    if (found.length === 0) {
        const names = context.symbols.map(({ symbol }) => symbol.name);
        const hint = suggest(name, names);
        return `Nothing in the Mona UI ${context.docs.version} API is called "${request}".${hint} search_docs finds symbols by what they do.`;
    }
    return found.map(renderSymbol).join("\n\n---\n\n");
}

export function checkTemplate(context: DocsContext, template: string): string {
    const { imports, problems } = context.checker.check(template);
    const lines: string[] = [];
    if (problems.length === 0) {
        lines.push(
            "No problems found with the Mona UI elements, directives, inputs, outputs and pipes in this template."
        );
    } else {
        const errors = problems.filter(problem => problem.severity === "error").length;
        const warnings = problems.length - errors;
        const counts = [
            errors > 0 ? plural(errors, "error") : "",
            warnings > 0 ? plural(warnings, "warning") : ""
        ].filter(Boolean);
        lines.push(`${counts.join(" and ")}:`, "");
        for (const problem of problems) {
            lines.push(`- ${problem.line}:${problem.column} ${problem.severity}: ${problem.message}`);
        }
    }
    if (imports.size > 0) {
        lines.push(
            "",
            "The template uses these Mona UI exports. Add them to the component's `imports` array:",
            "",
            "```typescript"
        );
        for (const [entryPoint, names] of imports) {
            lines.push(`import { ${names.join(", ")} } from "${PACKAGE_NAME}/${entryPoint}";`);
        }
        lines.push("```");
    }
    lines.push(
        "",
        "This checks Mona UI usage against the API reference, not expressions or types. `ng build` checks those."
    );
    return lines.join("\n");
}

/** Some of a section's prose around the first query word it has, on one line. */
function snippet(text: string, terms: readonly string[]): string {
    const prose = splitProseAndCode(text)
        .prose.replace(/^#+\s.*$/gm, "")
        .replace(/[*_>|]/g, "")
        .replace(/\s+/g, " ")
        .trim();
    const lower = prose.toLowerCase();
    const at = terms.map(term => lower.indexOf(term)).filter(index => index >= 0);
    const start = at.length > 0 ? Math.max(0, Math.min(...at) - 60) : 0;
    const cut = prose.slice(start, start + SNIPPET_LENGTH);
    return `${start > 0 ? "…" : ""}${cut}${start + SNIPPET_LENGTH < prose.length ? "…" : ""}` || "(code only)";
}

/** A page's title, with its entry point when the title is a topic of it, such as "Editing (grid)". */
function pageLabel(page: DocsPage): string {
    const letters = (text: string): string => text.toLowerCase().replace(/[^a-z0-9]/g, "");
    return page.entryPoint && !letters(page.title).includes(letters(page.entryPoint))
        ? `${page.title} (${page.entryPoint})`
        : page.title;
}

function plural(count: number, word: string): string {
    return `${count} ${word}${count === 1 ? "" : "s"}`;
}
