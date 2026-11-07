import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { flattenDocsPages } from "../src/app/layout/docs-manifest";
import type { DocsPage } from "../src/app/layout/docs-manifest";

/**
 * Checks the documentation site against `docs/internal/docs-page-schema.md`.
 *
 * Manifest problems (a route with no page, a page with no route, an unknown entry point) always fail. Page structure
 * problems are reported, and fail only under `--strict`, so this can run before the existing pages are migrated.
 */

export type SectionId =
    | "accessibility"
    | "anatomy"
    | "api"
    | "appearance"
    | "behavior"
    | "examples"
    | "forms"
    | "overview"
    | "quick-start"
    | "theming";

export type FindingKind =
    | "custom-heading"
    | "duplicate"
    | "missing-playground"
    | "missing-section"
    | "no-content"
    | "out-of-order"
    | "rename"
    | "split";

export interface PageFinding {
    readonly detail: string;
    readonly kind: FindingKind;
}

interface SectionDefinition {
    readonly aliases: readonly string[];
    readonly heading: string;
    readonly id: SectionId;
    readonly required: boolean;
}

/** The sections of a component page, in the order they must appear. */
export const SECTIONS: readonly SectionDefinition[] = [
    {
        aliases: ["Overview & Component Selection", "Overview & Usage Guidelines"],
        heading: "Overview",
        id: "overview",
        required: true
    },
    { aliases: ["Import & Basic Usage"], heading: "Import & Quick Start", id: "quick-start", required: true },
    {
        aliases: ["Anatomy & Public Structural Templates", "Anatomy & Structural Templates", "Anatomy & Options Resolution"],
        heading: "Anatomy",
        id: "anatomy",
        required: false
    },
    { aliases: ["Feature Examples", "Service Examples"], heading: "Examples", id: "examples", required: false },
    {
        aliases: ["Appearance", "Styling", "Styling and Class Extension", "Public Customization"],
        heading: "Appearance & Styling",
        id: "appearance",
        required: false
    },
    { aliases: [], heading: "Theming", id: "theming", required: false },
    {
        aliases: ["Technical & Behavior Notes", "Behavior Notes", "State & Behavior"],
        heading: "Behavior",
        id: "behavior",
        required: false
    },
    {
        aliases: ["Signal Forms", "Signal Forms Integration"],
        heading: "Forms Integration",
        id: "forms",
        required: false
    },
    {
        aliases: ["Accessibility Notes", "Accessibility Requirements", "Keyboard & Accessibility"],
        heading: "Accessibility",
        id: "accessibility",
        required: true
    },
    { aliases: ["API Matrix"], heading: "API", id: "api", required: true }
];

/** Headings that cover two sections and need dividing, not renaming. */
const COMBINED_HEADINGS: ReadonlyMap<string, readonly SectionId[]> = new Map<string, readonly SectionId[]>([
    ["Accessibility & Forms Integration", ["forms", "accessibility"]]
]);

/** Returns the level 2 headings of a markdown document, ignoring any inside code fences. */
export function extractH2Headings(markdown: string): string[] {
    const headings: string[] = [];
    let inFence = false;
    for (const line of markdown.split(/\r?\n/)) {
        if (/^\s*(```|~~~)/.test(line)) {
            inFence = !inFence;
        } else if (!inFence && line.startsWith("## ")) {
            headings.push(line.slice(3).trim());
        }
    }
    return headings;
}

/** Compares one component page's headings, in reading order, with the schema. */
export function checkComponentPage(headings: readonly string[], hasPlayground: boolean): PageFinding[] {
    const findings: PageFinding[] = [];
    if (!hasPlayground) {
        findings.push({ detail: "The page renders no demo component.", kind: "missing-playground" });
    }
    if (headings.length === 0) {
        findings.push({ detail: "The page has no markdown sections.", kind: "no-content" });
        return findings;
    }

    const orderOf = (id: SectionId): number => SECTIONS.findIndex(section => section.id === id);
    const seen = new Set<SectionId>();
    let previous = -1;

    for (const heading of headings) {
        const combined = COMBINED_HEADINGS.get(heading);
        const section = SECTIONS.find(item => item.heading === heading || item.aliases.includes(heading));
        const ids: readonly SectionId[] | undefined = combined ?? (section ? [section.id] : undefined);

        if (!ids) {
            findings.push({
                detail: `"${heading}" is not a schema section. Make it an H3 inside one.`,
                kind: "custom-heading"
            });
            continue;
        }
        if (combined) {
            const names = combined.map(id => SECTIONS[orderOf(id)].heading).join(" and ");
            findings.push({ detail: `Divide "${heading}" into ${names}.`, kind: "split" });
        } else if (section && section.heading !== heading) {
            findings.push({ detail: `Rename "${heading}" to "${section.heading}".`, kind: "rename" });
        }
        for (const id of ids) {
            if (seen.has(id)) {
                findings.push({ detail: `"${heading}" repeats the ${id} section.`, kind: "duplicate" });
            }
            seen.add(id);
            if (orderOf(id) < previous) {
                findings.push({ detail: `"${heading}" appears after a section it should precede.`, kind: "out-of-order" });
            }
            previous = Math.max(previous, orderOf(id));
        }
    }

    for (const section of SECTIONS) {
        if (section.required && !seen.has(section.id)) {
            findings.push({ detail: `Add the required "${section.heading}" section.`, kind: "missing-section" });
        }
    }
    // A simple component's usage is its visual options, so either section can carry the page's usage examples.
    if (!seen.has("examples") && !seen.has("appearance")) {
        findings.push({ detail: 'Add an "Examples" or "Appearance & Styling" section.', kind: "missing-section" });
    }
    return findings;
}

/** Compares the manifest with the router. Returned problems mean the two have drifted apart. */
export function checkManifest(
    pages: readonly DocsPage[],
    routePaths: readonly string[],
    entryPointExists: (entryPoint: string) => boolean
): string[] {
    const problems: string[] = [];
    const paths = pages.map(page => page.path);
    const routes = new Set(routePaths);
    const known = new Set(paths);

    for (const path of new Set(paths.filter((path, index) => paths.indexOf(path) !== index))) {
        problems.push(`"${path}" is in the manifest more than once.`);
    }
    for (const path of routes) {
        if (!known.has(path)) {
            problems.push(`Route "${path}" has no manifest page.`);
        }
    }
    for (const page of pages) {
        if (!routes.has(page.path)) {
            problems.push(`Manifest page "${page.path}" has no route.`);
        }
        if (page.kind === "component" && !page.entryPoint) {
            problems.push(`Component page "${page.path}" has no entry point.`);
        }
        if (page.entryPoint && !entryPointExists(page.entryPoint)) {
            problems.push(`Page "${page.path}" names unknown entry point "${page.entryPoint}".`);
        }
    }
    return problems;
}

/** Reads the docs routes from `routes.ts`, as route path to the doc component's path under `app/docs`. */
export function parseDocRoutes(routesSource: string): Map<string, string> {
    const pattern = /path: "([^"]+)",\s*loadComponent: \(\) =>\s*import\(\s*"\.\/docs\/([^"]+)"\s*\)/g;
    return new Map([...routesSource.matchAll(pattern)].map(match => [match[1], match[2]]));
}

function main(): void {
    const scriptDirectory = dirname(fileURLToPath(import.meta.url));
    const appDirectory = resolve(scriptDirectory, "../src/app");
    const assetsDirectory = resolve(scriptDirectory, "../src/assets");
    const libraryDirectory = resolve(scriptDirectory, "../../mona-ui");
    const strict = process.argv.includes("--strict");
    const verbose = process.argv.includes("--verbose");

    const pages = flattenDocsPages();
    const routes = parseDocRoutes(readFileSync(join(appDirectory, "routes.ts"), "utf8"));
    const problems = checkManifest(pages, [...routes.keys()], entryPoint =>
        existsSync(join(libraryDirectory, entryPoint, "public-api.ts"))
    );

    const componentPages = pages.filter(page => page.kind === "component" && routes.has(page.path));
    const counts = new Map<FindingKind, number>();
    const generatedApi = (path: string): string => `docs/${path}/api.md`;
    let conforming = 0;

    for (const page of componentPages) {
        const base = join(appDirectory, "docs", routes.get(page.path) ?? "");
        const template = [`${base}.html`, `${base}.ts`]
            .filter(file => existsSync(file))
            .map(file => readFileSync(file, "utf8"))
            .join("\n");
        const files = [...template.matchAll(/docs\/[a-z0-9/-]+\.md/g)].map(match => join(assetsDirectory, match[0]));
        const headings = files
            .filter(file => existsSync(file))
            .flatMap(file => extractH2Headings(readFileSync(file, "utf8")));
        const findings = checkComponentPage(headings, /<app-[a-z0-9-]+-demo\b/.test(template));
        if (!template.includes(generatedApi(page.path))) {
            problems.push(`Page "${page.path}" doesn't render its generated ${generatedApi(page.path)}.`);
        }

        if (findings.length === 0) {
            conforming++;
        }
        for (const finding of findings) {
            counts.set(finding.kind, (counts.get(finding.kind) ?? 0) + 1);
        }
        if (verbose && findings.length > 0) {
            console.log(`\n${page.path}`);
            findings.forEach(finding => console.log(`  [${finding.kind}] ${finding.detail}`));
        }
    }

    console.log(`\nComponent pages matching the schema: ${conforming} of ${componentPages.length}`);
    [...counts]
        .sort((first, second) => second[1] - first[1])
        .forEach(([kind, count]) => console.log(`  ${kind}: ${count}`));

    if (problems.length > 0) {
        console.error("\nManifest problems:");
        problems.forEach(problem => console.error(`  ${problem}`));
    }
    if (problems.length > 0 || (strict && conforming < componentPages.length)) {
        process.exit(1);
    }
}

if (process.env["VITEST"] !== "true" && process.argv[1]?.endsWith("check-docs-schema.ts")) {
    main();
}
