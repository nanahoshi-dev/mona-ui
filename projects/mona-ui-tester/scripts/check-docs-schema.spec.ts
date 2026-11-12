import { describe, expect, it } from "vitest";
import { flattenDocsPages } from "../src/app/layout/docs-manifest";
import type { DocsPage } from "../src/app/layout/docs-manifest";
import { checkComponentPage, checkManifest, extractH2Headings, parseDocRoutes } from "./check-docs-schema";

const COMPLETE = ["Overview", "Import & Quick Start", "Examples", "Accessibility", "API"];

function kinds(headings: readonly string[], hasPlayground = true): string[] {
    return checkComponentPage(headings, hasPlayground).map(finding => finding.kind);
}

describe("check-docs-schema", () => {
    describe("extractH2Headings", () => {
        it("reads level 2 headings only, across line endings", () => {
            expect(extractH2Headings("# Title\r\n## One\r\n### Nested\n## Two")).toEqual(["One", "Two"]);
        });

        it("ignores headings inside code fences", () => {
            expect(extractH2Headings("## Real\n```md\n## Fake\n```\n## Also real")).toEqual(["Real", "Also real"]);
        });
    });

    describe("checkComponentPage", () => {
        it("accepts a complete page", () => {
            expect(kinds(COMPLETE)).toEqual([]);
        });

        it("accepts optional sections in their place", () => {
            expect(
                kinds([
                    "Overview",
                    "Import & Quick Start",
                    "Anatomy",
                    "Examples",
                    "Appearance & Styling",
                    "Theming",
                    "Behavior",
                    "Forms Integration",
                    "Accessibility",
                    "API"
                ])
            ).toEqual([]);
        });

        it("asks for an alias to be renamed, and counts it as the section it names", () => {
            expect(kinds(["Overview", "Import & Basic Usage", "Examples", "Accessibility", "API"])).toEqual(["rename"]);
        });

        it("asks for a combined heading to be divided, and counts it as both sections", () => {
            const headings = [
                "Overview",
                "Import & Quick Start",
                "Examples",
                "Accessibility & Forms Integration",
                "API"
            ];
            expect(kinds(headings)).toEqual(["split"]);
        });

        it("reports sections in the wrong order", () => {
            expect(kinds(["Import & Quick Start", "Overview", "Examples", "Accessibility", "API"])).toEqual([
                "out-of-order"
            ]);
        });

        it("reports a repeated section", () => {
            expect(kinds([...COMPLETE.slice(0, 3), "Accessibility", "Accessibility Notes", "API"])).toEqual([
                "rename",
                "duplicate"
            ]);
        });

        it("reports a heading outside the schema without treating it as out of order", () => {
            expect(kinds(["Overview", "Length", "Import & Quick Start", "Examples", "Accessibility", "API"])).toEqual([
                "custom-heading"
            ]);
        });

        it("reports each missing required section", () => {
            expect(kinds(["Overview", "Import & Quick Start", "API"])).toEqual(["missing-section", "missing-section"]);
        });

        it("accepts Appearance & Styling in place of Examples", () => {
            expect(kinds(["Overview", "Import & Quick Start", "Appearance & Styling", "Accessibility", "API"])).toEqual(
                []
            );
        });

        it("reports a page with no demo", () => {
            expect(kinds(COMPLETE, false)).toEqual(["missing-playground"]);
        });

        it("reports a page with no markdown once, not as every missing section", () => {
            expect(kinds([])).toEqual(["no-content"]);
        });
    });

    describe("checkManifest", () => {
        const page = (path: string, entryPoint?: string): DocsPage => ({
            description: "A page.",
            entryPoint,
            kind: entryPoint ? "component" : "guide",
            path,
            title: path
        });

        it("accepts a manifest that matches the routes", () => {
            expect(checkManifest([page("intro"), page("button", "button")], ["intro", "button"], () => true)).toEqual(
                []
            );
        });

        it("reports drift in both directions", () => {
            expect(checkManifest([page("old")], ["new"], () => true)).toEqual([
                'Route "new" has no manifest page.',
                'Manifest page "old" has no route.'
            ]);
        });

        it("reports duplicates, unknown entry points and component pages without one", () => {
            const pages: DocsPage[] = [page("a"), page("a"), page("b", "missing"), { ...page("c"), kind: "component" }];
            expect(checkManifest(pages, ["a", "b", "c"], entryPoint => entryPoint !== "missing")).toEqual([
                '"a" is in the manifest more than once.',
                'Page "b" names unknown entry point "missing".',
                'Component page "c" has no entry point.'
            ]);
        });

        it("wants a sub-page's path to be its parent's and one more segment", () => {
            const parent: DocsPage = {
                ...page("sidebar", "sidebar"),
                children: [page("sidebar/menus", "sidebar"), page("sidebar-state", "sidebar")]
            };
            const pages = [parent, ...(parent.children ?? [])];
            expect(checkManifest(pages, ["sidebar", "sidebar/menus", "sidebar-state"], () => true)).toEqual([
                'Page "sidebar-state" is nested under "sidebar", so its path should be "sidebar/<name>".'
            ]);
        });
    });

    describe("parseDocRoutes", () => {
        it("reads docs routes, across wrapped imports, and skips other routes", () => {
            const source = `
                { path: "button", loadComponent: () => import("./docs/components/button-doc/button-doc.component").then(m => m.A) },
                { path: "grid", loadComponent: () =>
                    import("./docs/components/grid-doc/grid-doc.component").then(
                        m => m.B
                    ) },
                { path: "components", loadComponent: () => import("./layout/components/components/components.component").then(m => m.C) },
                { path: "browser-test/x", loadComponent: () => import("./browser-test/x.component").then(m => m.D) }
            `;
            expect([...parseDocRoutes(source)]).toEqual([
                ["button", "components/button-doc/button-doc.component"],
                ["grid", "components/grid-doc/grid-doc.component"]
            ]);
        });
    });

    describe("DOCS_MANIFEST", () => {
        it("gives every page a one-line description with no markdown", () => {
            for (const page of flattenDocsPages()) {
                expect(page.description, page.path).toMatch(/^[^`*\n]+\.$/);
            }
        });
    });
});
