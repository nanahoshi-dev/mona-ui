import { describe, expect, it } from "vitest";
import type { DocsCategory, DocsPage } from "../src/app/layout/docs-manifest";
import {
    cleanPageMarkdown,
    cleanReferenceMarkdown,
    inlineExamples,
    listPages,
    renderLlmsTxt,
    renderPage
} from "./generate-ai-docs";

const button: DocsPage = {
    description: "Styles a native button.",
    entryPoint: "button",
    kind: "component",
    path: "button",
    title: "Button"
};

describe("generate-ai-docs", () => {
    it("inlines an example's component, then its template", () => {
        const markdown = "Before\n\n```example\nbutton/looks\n```\n\nAfter";
        const result = inlineExamples(markdown, () => [
            { content: "<button monaButton></button>\n", name: "looks-example.component.html" },
            { content: "export class A {}\n", name: "looks-example.component.ts" }
        ]);

        expect(result).toBe(
            "Before\n\n`looks-example.component.ts`\n\n```typescript\nexport class A {}\n```\n\n" +
                "`looks-example.component.html`\n\n```html\n<button monaButton></button>\n```\n\nAfter"
        );
    });

    it("leaves other code blocks alone", () => {
        const markdown = "```html\n<a></a>\n```";

        expect(inlineExamples(markdown, () => [])).toBe(markdown);
    });

    it("fails on an example without files", () => {
        expect(() => inlineExamples("```example\nmissing/one\n```", () => [])).toThrow("missing/one");
    });

    it("drops H1s and comments, and points page links at markdown files", () => {
        const markdown =
            "# Title\r\n\r\nSee [Calendar](../calendar) and [forms](/components/forms#signal-forms).\r\n\r\n<!-- checklist -->\r\nEnd";

        expect(cleanPageMarkdown(markdown)).toBe(
            "See [Calendar](calendar.md) and [forms](forms.md#signal-forms).\n\nEnd"
        );
    });

    it("points a link to a nested page at its file, named with dashes", () => {
        expect(cleanPageMarkdown("See [state](/components/sidebar/state#where-it-is-kept).")).toBe(
            "See [state](sidebar-state.md#where-it-is-kept)."
        );
    });

    it("points a link to an API reference page at its entry point's file, at the symbol's heading", () => {
        expect(cleanPageMarkdown("See [`ChartPoint`](/api/chart/ChartPoint) in [chart](/api/chart).")).toBe(
            "See [`ChartPoint`](api/chart.md#chartpoint) in [chart](api/chart.md)."
        );
    });

    it("points a reference file's links at the files next to it and at the pages one folder up", () => {
        expect(cleanReferenceMarkdown("[Chart](/components/sidebar/state) uses [`Point`](/api/chart/Point).")).toBe(
            "[Chart](../sidebar-state.md) uses [`Point`](chart.md#point)."
        );
    });

    it("heads a page with its title, description and entry point", () => {
        const page = renderPage(button, ["## Overview\n\nText"]);

        expect(
            page.startsWith("# Button\n\n> Styles a native button.\n\nEntry point: `@nanahoshi/mona-ui/button`")
        ).toBe(true);
        expect(page).toContain("## Overview\n\nText");
    });

    it("lists pages by category, after the essentials", () => {
        const text = renderLlmsTxt(
            [{ category: "Actions", markdown: "", page: button }],
            "Essentials here.",
            page => `docs/${page.path}.md`,
            "llms-full.txt"
        );

        expect(text).toContain(
            "# Mona UI\n\nEssentials here.\n\n## Actions\n\n- [Button](docs/button.md): Styles a native button."
        );
        expect(text).toContain("[All pages in one file](llms-full.txt)");
    });

    it("lists each entry point's API reference after the pages", () => {
        const text = renderLlmsTxt(
            [{ category: "Actions", markdown: "", page: button }],
            "Essentials here.",
            page => `docs/${page.path}.md`,
            undefined,
            [
                { exportCount: 1, link: "docs/api/avatar.md", name: "avatar" },
                { exportCount: 5, link: "docs/api/button.md", name: "button" }
            ]
        );

        expect(text).toContain(
            "## API Reference\n\n" +
                "- [`@nanahoshi/mona-ui/avatar`](docs/api/avatar.md): 1 export, in full.\n" +
                "- [`@nanahoshi/mona-ui/button`](docs/api/button.md): 5 exports, in full."
        );
    });

    it("includes sub-pages under their parent's category", () => {
        const categories: DocsCategory[] = [
            { id: "data", pages: [{ ...button, children: [{ ...button, path: "button-group" }] }], title: "Data" }
        ];

        expect(listPages(categories).map(entry => `${entry.category}/${entry.page.path}`)).toEqual([
            "Data/button",
            "Data/button-group"
        ]);
    });
});
