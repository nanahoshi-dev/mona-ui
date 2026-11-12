import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DOCS_MANIFEST, docsPageSlug } from "../src/app/layout/docs-manifest";
import type { DocsCategory, DocsPage } from "../src/app/layout/docs-manifest";
import { PAGES_WITHOUT_MARKDOWN, readRouteSources } from "./generate-search-index";

/**
 * Writes the documentation as plain markdown for coding agents: one file per page, with each example's code inlined
 * where the site shows it live, a short `llms.txt` index, and `llms-full.txt` with every page in one file.
 *
 * By default the files go to `dist/docs-ai`, which the tester's build serves at the site root. With `--package` they go
 * into the built library at `dist/mona-ui`, so the installed version always carries its own docs.
 */

export interface AiDocsPage {
    readonly category: string;
    readonly markdown: string;
    readonly page: DocsPage;
}

const EXAMPLE_FENCE = /^```example\r?\n([^\r\n]+)\r?\n```$/gm;
// eslint-disable-next-line @typescript-eslint/naming-convention -- The keys are file extensions.
const FENCE_LANGUAGE: Readonly<Record<string, string>> = { ".html": "html", ".ts": "typescript" };

/** A component's file first, then its template, then anything else, so the code reads top down. */
const exampleFileOrder = (name: string): number =>
    name.endsWith(".component.ts") ? 0 : name.endsWith(".component.html") ? 1 : 2;

/** Replaces each ```example fence, which the site renders live, with the example's own files. */
export function inlineExamples(
    markdown: string,
    readExample: (id: string) => readonly { content: string; name: string }[]
): string {
    return markdown.replace(EXAMPLE_FENCE, (_match, id: string) => {
        const files = [...readExample(id.trim())].sort(
            (first, second) => exampleFileOrder(first.name) - exampleFileOrder(second.name)
        );
        if (files.length === 0) {
            throw new Error(`Example "${id}" has no files.`);
        }
        return files
            .map(
                file =>
                    `\`${file.name}\`\n\n\`\`\`${FENCE_LANGUAGE[extname(file.name)] ?? ""}\n${file.content.trimEnd()}\n\`\`\``
            )
            .join("\n\n");
    });
}

/**
 * Makes a page's markdown stand alone. The manifest gives the title, so H1s go. HTML comments, such as verification
 * checklists, are only noise to an agent. Links to other pages point at their markdown files, which sit side by side.
 */
export function cleanPageMarkdown(markdown: string): string {
    return markdown
        .replace(/\r\n/g, "\n")
        .replace(/<!--[\s\S]*?-->\n?/g, "")
        .replace(/^# .*\n+/gm, "")
        .replace(
            /\]\((?:\/components\/|\.\.\/)([a-z0-9-]+(?:\/[a-z0-9-]+)*)(#[^)]*)?\)/g,
            (_link, path: string, hash: string | undefined) => `](${docsPageSlug({ path })}.md${hash ?? ""})`
        )
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

export function renderPage(page: DocsPage, sources: readonly string[]): string {
    const header = [`# ${page.title}`, "", `> ${page.description}`];
    if (page.entryPoint) {
        header.push("", `Entry point: \`@nanahoshi/mona-ui/${page.entryPoint}\``);
    }
    return `${[...header, "", ...sources.map(cleanPageMarkdown)].join("\n\n").replace(/\n{3,}/g, "\n\n")}\n`;
}

export function renderLlmsTxt(
    pages: readonly AiDocsPage[],
    essentials: string,
    linkTo: (page: DocsPage) => string,
    fullLink?: string
): string {
    const lines = ["# Mona UI", "", essentials.trim(), ""];
    const categories = [...new Set(pages.map(entry => entry.category))];
    for (const category of categories) {
        lines.push(`## ${category}`, "");
        for (const { page } of pages.filter(entry => entry.category === category)) {
            lines.push(`- [${page.title}](${linkTo(page)}): ${page.description}`);
        }
        lines.push("");
    }
    if (fullLink) {
        lines.push("## Optional", "", `- [All pages in one file](${fullLink}): every page above, in this order.`, "");
    }
    return lines.join("\n");
}

/** Every page in the manifest, sub-pages included, with the category it's listed under. */
export function listPages(categories: readonly DocsCategory[]): { category: string; page: DocsPage }[] {
    const flatten = (pages: readonly DocsPage[]): DocsPage[] =>
        pages.flatMap(page => [page, ...flatten(page.children ?? [])]);
    return categories.flatMap(category => flatten(category.pages).map(page => ({ category: category.title, page })));
}

function main(): void {
    const scriptDirectory = dirname(fileURLToPath(import.meta.url));
    const testerRoot = resolve(scriptDirectory, "..");
    const appRoot = join(testerRoot, "src/app");
    const repositoryRoot = resolve(testerRoot, "../..");
    const forPackage = process.argv.includes("--package");

    const readComponent = (importPath: string): string => {
        const base = join(appRoot, importPath);
        return [`${base}.html`, `${base}.ts`]
            .filter(file => existsSync(file))
            .map(file => readFileSync(file, "utf8"))
            .join("\n");
    };
    const readMarkdown = (source: string): string => {
        // The guides are served from the repository's docs folder, under this path. See angular.json.
        const file = source.startsWith("docs/guides/")
            ? join(repositoryRoot, "docs", source.slice("docs/guides/".length))
            : join(testerRoot, "src/assets", source);
        return readFileSync(file, "utf8");
    };
    const readExample = (id: string): { content: string; name: string }[] => {
        const directory = join(appRoot, "examples", id);
        if (!existsSync(directory)) {
            throw new Error(`Example "${id}" doesn't exist.`);
        }
        return readdirSync(directory).map(name => ({
            content: readFileSync(join(directory, name), "utf8").replace(/\r\n/g, "\n"),
            name
        }));
    };

    const routes = readRouteSources(readFileSync(join(appRoot, "routes.ts"), "utf8"), readComponent);
    const pages: AiDocsPage[] = [];
    for (const { category, page } of listPages(DOCS_MANIFEST)) {
        const sources = routes.get(page.path) ?? [];
        if (sources.length === 0) {
            if (!PAGES_WITHOUT_MARKDOWN.includes(page.path) && routes.has(page.path)) {
                throw new Error(`Page "${page.path}" shows no markdown that this script can find.`);
            }
            continue;
        }
        const markdown = renderPage(
            page,
            sources.map(source => inlineExamples(readMarkdown(source), readExample))
        );
        pages.push({ category, markdown, page });
    }

    const essentials = readFileSync(join(testerRoot, "ai/llms-essentials.md"), "utf8").replace(/\r\n/g, "\n");
    const outputRoot = forPackage ? join(repositoryRoot, "dist/mona-ui") : join(repositoryRoot, "dist/docs-ai");
    const pagesFolder = forPackage ? "docs" : "components";
    if (forPackage && !existsSync(join(outputRoot, "package.json"))) {
        throw new Error("Build the library first: dist/mona-ui has no package.json.");
    }
    rmSync(join(outputRoot, pagesFolder), { force: true, recursive: true });
    if (!forPackage) {
        rmSync(outputRoot, { force: true, recursive: true });
    }
    mkdirSync(join(outputRoot, pagesFolder), { recursive: true });

    for (const { markdown, page } of pages) {
        writeFileSync(join(outputRoot, pagesFolder, `${docsPageSlug(page)}.md`), markdown);
    }
    const linkTo = (page: DocsPage): string => `${pagesFolder}/${docsPageSlug(page)}.md`;
    writeFileSync(
        join(outputRoot, "llms.txt"),
        renderLlmsTxt(pages, essentials, linkTo, forPackage ? undefined : "llms-full.txt")
    );
    if (!forPackage) {
        writeFileSync(join(outputRoot, "llms-full.txt"), pages.map(entry => entry.markdown).join("\n---\n\n"));
    }
    const where = forPackage ? "dist/mona-ui" : "dist/docs-ai";
    console.log(`Wrote ${pages.length} pages and llms.txt to ${where}.`);
}

if (process.env["VITEST"] !== "true" && process.argv[1]?.endsWith("generate-ai-docs.ts")) {
    try {
        main();
    } catch (error: unknown) {
        console.error(error);
        process.exit(1);
    }
}
