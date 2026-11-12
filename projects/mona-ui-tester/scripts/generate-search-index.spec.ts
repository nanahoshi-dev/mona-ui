import { describe, expect, it } from "vitest";
import type { DocsPage } from "../src/app/layout/docs-manifest";
import { readRouteSources, renderApiSearchDocument, renderSearchDocument } from "./generate-search-index";

const PAGE: DocsPage = {
    description: "A <searchable> list.",
    kind: "component",
    path: "command",
    title: "Command Menu"
};

describe("generate-search-index", () => {
    it("reads which markdown each route's component shows, in order", () => {
        const routes = `
            { path: "forms", loadComponent: () => import("./docs/forms-doc") },
            {
                path: "popup-menu",
                loadComponent: () =>
                    import("./docs/popup-menu-doc").then(m => m.Doc)
            },
            { path: "theme-luna", loadComponent: () => import("./docs/luna-doc") }
        `;
        const components = new Map([
            ["./docs/forms-doc", '<app-markdown-doc src="docs/guides/forms.md"></app-markdown-doc>'],
            ["./docs/luna-doc", "<p>No markdown</p>"],
            ["./docs/popup-menu-doc", '<a src="docs/popup-menu/intro.md"></a> <a src="docs/popup-menu/api.md"></a>']
        ]);

        const sources = readRouteSources(routes, importPath => components.get(importPath) ?? "");

        expect(Object.fromEntries(sources)).toEqual({
            forms: ["docs/guides/forms.md"],
            "popup-menu": ["docs/popup-menu/intro.md", "docs/popup-menu/api.md"],
            "theme-luna": []
        });
    });

    it("takes the title from the manifest, not from the markdown's H1", () => {
        const html = renderSearchDocument(PAGE, "Navigation", ["# Another title\n\nText"]);

        expect(html).toContain("<h1>Command Menu</h1>");
        expect(html).not.toContain("Another title");
    });

    it("escapes what the manifest says", () => {
        expect(renderSearchDocument(PAGE, "A & B", [])).toContain("A &lt;searchable&gt; list.");
        expect(renderSearchDocument(PAGE, "A & B", [])).toContain('content="A &amp; B"');
    });

    it("gives headings the ids the site gives them, unique across the page's files", () => {
        const html = renderSearchDocument(PAGE, "Navigation", ["## Import & Quick Start", "## Overview\n\n## Overview"]);

        expect(html).toContain('<h2 id="import-quick-start">');
        expect(html).toContain('<h2 id="overview">');
        expect(html).toContain('<h2 id="overview-2">');
    });

    it("reads a heading's id from its text, not its markup", () => {
        expect(renderSearchDocument(PAGE, "Navigation", ["### `CommandComponent`"])).toContain(
            '<h3 id="commandcomponent"><code>CommandComponent</code></h3>'
        );
    });

    it("keeps code blocks out of the index, and inline code in", () => {
        const html = renderSearchDocument(PAGE, "Navigation", ["Use `query`.\n\n```html\n<a></a>\n```"]);

        expect(html).toContain("<code>query</code>");
        expect(html).toContain("<pre data-pagefind-ignore>&lt;a&gt;&lt;/a&gt;</pre>");
    });

    it("indexes a symbol's reference page with each member under the anchor the page gives it", () => {
        const html = renderApiSearchDocument("chart", {
            description: "Exports with <title> kept as text.",
            inputs: [{ description: "Sets the `value`.", name: "value", twoWay: true, type: "string" }],
            kind: "component",
            name: "ChartComponent"
        });

        expect(html).toContain('content="API Reference"');
        expect(html).toContain("<h1>ChartComponent</h1>\n<p>Component from @nanahoshi/mona-ui/chart.</p>");
        expect(html).toContain("Exports with &lt;title&gt; kept as text.");
        expect(html).toContain('<h2 id="inputs">Inputs</h2>');
        expect(html).toContain('<h3 id="value">value</h3><p>Sets the <code>value</code>.</p>');
        expect(html).toContain('<h3 id="valuechange">valueChange</h3>');
    });
});
