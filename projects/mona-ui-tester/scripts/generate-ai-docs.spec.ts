import { describe, expect, it } from "vitest";
import type { DocsCategory, DocsPage } from "../src/app/layout/docs-manifest";
import { cleanPageMarkdown, inlineExamples, listPages, renderLlmsTxt, renderPage } from "./generate-ai-docs";

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
