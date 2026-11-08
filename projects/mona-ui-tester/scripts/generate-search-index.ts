import { existsSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Marked } from "marked";
import { createUniqueHeadingId } from "../src/app/layout/docs-heading-id";
import { DOCS_MANIFEST } from "../src/app/layout/docs-manifest";
import type { DocsPage } from "../src/app/layout/docs-manifest";

/**
 * Builds the documentation's search index. The site renders its pages in the browser, so there's no HTML for Pagefind
 * to crawl: this renders each page's markdown to the same headings the site shows, and hands that over. The index goes
 * to `dist/docs-search`, which the tester's build serves at `/pagefind`.
 */

export const PAGES_WITHOUT_MARKDOWN: readonly string[] = ["theme-colors", "theme-luna"];

const ROUTE = /path: "([^"]+)",\s*loadComponent: \(\) =>\s*import\("([^"]+)"\)/g;
const MARKDOWN_SOURCE = /src="(docs\/[^"]+\.md)"/g;

const escapeHtml = (text: string): string =>
    text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** What a heading reads as on the page, which is what its id comes from. */
const headingText = (html: string): string =>
    html
        .replace(/<[^>]*>/g, "")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, "&")
        .trim();

/** The markdown a route's component shows, in the order it shows it, as paths relative to the assets folder. */
export function readRouteSources(routes: string, readComponent: (importPath: string) => string): Map<string, string[]> {
    const sources = new Map<string, string[]>();
    for (const [, routePath, importPath] of routes.matchAll(ROUTE)) {
        sources.set(
            routePath,
            Array.from(readComponent(importPath).matchAll(MARKDOWN_SOURCE), match => match[1])
        );
    }
    return sources;
}

/**
 * One page as HTML for the index. The manifest gives the title, so an H1 in the markdown is left out. Headings keep the
 * ids the site gives them, and code blocks stay out of the index: their excerpts read badly, and what's worth finding
 * in them, such as selectors and inputs, is also in the prose and the API tables.
 */
export function renderSearchDocument(page: DocsPage, category: string, markdown: readonly string[]): string {
    const ids = new Set<string>();
    const marked = new Marked({
        renderer: {
            code: ({ text }) => `<pre data-pagefind-ignore>${escapeHtml(text)}</pre>`,
            heading({ depth, tokens }) {
                const html = this.parser.parseInline(tokens);
                const id = createUniqueHeadingId(headingText(html), ids);
                return depth === 1 ? "" : `<h${depth} id="${id}">${html}</h${depth}>`;
            }
        }
    });
    const body = markdown.map(source => marked.parse(source, { async: false })).join("\n");
    return [
        `<html lang="en"><head><meta data-pagefind-meta="category[content]" content="${escapeHtml(category)}"></head>`,
        `<body><h1>${escapeHtml(page.title)}</h1><p>${escapeHtml(page.description)}</p>`,
        body,
        "</body></html>"
    ].join("\n");
}

async function main(): Promise<void> {
    const scriptDirectory = dirname(fileURLToPath(import.meta.url));
    const testerRoot = resolve(scriptDirectory, "..");
    const appRoot = join(testerRoot, "src/app");
    const repositoryRoot = resolve(testerRoot, "../..");
    const outputPath = join(repositoryRoot, "dist/docs-search");

    const readComponent = (importPath: string): string => {
        const base = join(appRoot, importPath);
        const parts = [`${base}.html`, `${base}.ts`].filter(file => existsSync(file));
        return parts.map(file => readFileSync(file, "utf8")).join("\n");
    };
    const readMarkdown = (source: string): string => {
        // The guides are served from the repository's docs folder, under this path. See angular.json.
        const file = source.startsWith("docs/guides/")
            ? join(repositoryRoot, "docs", source.slice("docs/guides/".length))
            : join(testerRoot, "src/assets", source);
        return readFileSync(file, "utf8");
    };

    // Pagefind only ships as an ES module, and this script runs as CommonJS.
    const pagefind = await import("pagefind");
    const routes = readRouteSources(readFileSync(join(appRoot, "routes.ts"), "utf8"), readComponent);
    const { errors: createErrors, index } = await pagefind.createIndex({ forceLanguage: "en" });
    if (!index) {
        throw new Error(`Pagefind couldn't start: ${createErrors.join(", ")}`);
    }

    let pageCount = 0;
    for (const category of DOCS_MANIFEST) {
        for (const page of category.pages) {
            const sources = routes.get(page.path);
            if (!sources) {
                throw new Error(`No route for the manifest's page "${page.path}".`);
            }
            if (sources.length === 0 && !PAGES_WITHOUT_MARKDOWN.includes(page.path)) {
                throw new Error(`Page "${page.path}" shows no markdown that this script can find.`);
            }
            const { errors } = await index.addHTMLFile({
                content: renderSearchDocument(page, category.title, sources.map(readMarkdown)),
                url: `/components/${page.path}`
            });
            if (errors.length > 0) {
                throw new Error(`Couldn't index "${page.path}": ${errors.join(", ")}`);
            }
            pageCount++;
        }
    }

    rmSync(outputPath, { force: true, recursive: true });
    const { errors } = await index.writeFiles({ outputPath });
    if (errors.length > 0) {
        throw new Error(`Couldn't write the index: ${errors.join(", ")}`);
    }
    await pagefind.close();
    console.log(`Indexed ${pageCount} pages into ${readdirSync(outputPath).length} files at dist/docs-search.`);
}

if (process.env["VITEST"] !== "true" && process.argv[1]?.endsWith("generate-search-index.ts")) {
    main().catch((error: unknown) => {
        console.error(error);
        process.exit(1);
    });
}
