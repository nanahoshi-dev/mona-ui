import { describe, expect, it } from "vitest";
import { findSection, renderOutline, slugify, splitProseAndCode, splitSections } from "./markdown.js";

const PAGE = `# Button

Intro.

## Examples

### Looks

\`\`\`html
## Not a heading
\`\`\`

### Loading

Text.

## Accessibility

More.
`;

describe("markdown", () => {
    it("splits a page at its headings, leaving code blocks alone", () => {
        const sections = splitSections(PAGE);

        expect(sections.map(section => section.path.join(" > ") || section.heading)).toEqual([
            "Introduction",
            "Examples",
            "Examples > Looks",
            "Examples > Loading",
            "Accessibility"
        ]);
        expect(PAGE.slice(sections[0].start, sections[0].end)).toBe("# Button\n\nIntro.\n\n");
    });

    it("ends a section's own text at the next heading, and with its sub-sections at the next of its level", () => {
        const sections = splitSections(PAGE);
        const examples = sections[1];

        expect(PAGE.slice(examples.start, examples.end)).toBe("## Examples\n\n");
        expect(PAGE.slice(examples.start, examples.endWithSubsections)).toContain("### Loading\n\nText.");
        expect(PAGE.slice(examples.start, examples.endWithSubsections)).not.toContain("Accessibility");
    });

    it("finds a section by heading, anchor or path, ignoring case", () => {
        const sections = splitSections(PAGE);

        expect(findSection(sections, "looks")?.heading).toBe("Looks");
        expect(findSection(sections, "#loading")?.heading).toBe("Loading");
        expect(findSection(sections, "Examples / Looks")?.heading).toBe("Looks");
        expect(findSection(sections, "access")?.heading).toBe("Accessibility");
        expect(findSection(sections, "Missing")).toBeUndefined();
    });

    it("outlines a page with each section's size", () => {
        expect(renderOutline(splitSections(PAGE))).toMatch(/^- Examples \(~\d+ tokens\)\n {2}- Looks/);
    });

    it("takes code blocks and example file names out of the prose", () => {
        const { code, prose } = splitProseAndCode("Before\n\n`a.component.ts`\n\n```ts\nconst a = 1;\n```\n\nAfter");

        expect(prose.replace(/\n+/g, " ").trim()).toBe("Before After");
        expect(code).toContain("const a = 1;");
        expect(code).toContain("a.component.ts");
    });

    it("makes anchors the way the docs site does", () => {
        expect(slugify("Import & Quick `Start`")).toBe("import-quick-start");
    });
});
