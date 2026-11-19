import { rmSync } from "node:fs";
import { afterAll, describe, expect, it } from "vitest";
import { DocsContext } from "./docs-context.js";
import { MonaDocs } from "./docs-data.js";
import { writeFixturePackage } from "./test-fixture.js";
import { checkTemplate, FULL_PAGE_LIMIT, getApi, getDocsPage, listComponents, searchDocs } from "./tools.js";

const root = writeFixturePackage();
const context = new DocsContext(new MonaDocs({ origin: "option", root }));

describe("tools", () => {
    afterAll(() => rmSync(root, { force: true, recursive: true }));

    describe("listComponents", () => {
        it("lists the essentials, then the pages by category, then entry points without a page", () => {
            const text = listComponents(context);

            expect(text).toMatch(/^# Mona UI 1\.2\.3\n\n## Essentials/);
            expect(text).toContain(
                '### Actions\n\n- Button ("button", `@nanahoshi/mona-ui/button`): Styles a native button.'
            );
            expect(text).toContain("Entry points without a page of their own: common, popover, text-box.");
        });

        it("lists one category, or says which there are", () => {
            expect(listComponents(context, "data")).toContain("- Grid (");
            expect(listComponents(context, "data")).not.toContain("- Button (");
            expect(listComponents(context, "charts")).toBe(
                'No category matches "charts". The categories are: Actions, Data.'
            );
        });
    });

    describe("searchDocs", () => {
        it("finds sections and symbols, each with the call that reads it", () => {
            const text = searchDocs(context, "inline editing");

            expect(text).toContain('Grid › Editing › Inline editing: get_docs_page("grid", section: "Inline editing")');
            expect(text).toContain(
                'GridEditableDirective (directive from `@nanahoshi/mona-ui/grid`, `mona-grid[monaGridEditable]`): get_api("GridEditableDirective")'
            );
            expect(text).toContain("Documented on the Grid page.");
        });

        it("searches only the docs or only the API when asked", () => {
            expect(searchDocs(context, "grid", 8, "api")).not.toContain("get_docs_page");
            expect(searchDocs(context, "grid", 8, "docs")).not.toContain("get_api");
        });

        it("says when nothing matches", () => {
            expect(searchDocs(context, "spaceship")).toContain('Nothing in the Mona UI 1.2.3 docs matches "spaceship"');
        });
    });

    describe("getDocsPage", () => {
        it("returns a short page whole, by name, title or entry point", () => {
            const page = getDocsPage(context, "button");

            expect(page).toMatch(/^# Button\n/);
            expect(page).toContain("### Loading");
            expect(getDocsPage(context, "Button")).toBe(page);
            expect(getDocsPage(context, "@nanahoshi/mona-ui/button")).toBe(page);
        });

        it("returns a long page's intro and outline, or all of it when asked", () => {
            const outline = getDocsPage(context, "grid");

            expect(outline.length).toBeLessThan(FULL_PAGE_LIMIT);
            expect(outline).toContain("The grid pages, sorts and edits.");
            expect(outline).toContain("- Editing (~");
            expect(outline).toContain("  - Inline editing (~");
            expect(getDocsPage(context, "grid", undefined, true).length).toBeGreaterThan(FULL_PAGE_LIMIT);
        });

        it("returns a section with its sub-sections, under the page's title and entry point", () => {
            expect(getDocsPage(context, "button", "Examples")).toMatch(
                /^# Button › Examples\n\nEntry point: `@nanahoshi\/mona-ui\/button`\n\n## Examples\n\n### Looks[\s\S]*### Loading/
            );
        });

        it("lists the sections when the one asked for doesn't exist, and close pages when the page doesn't", () => {
            expect(getDocsPage(context, "button", "Theming")).toContain(
                'The Button page has no section "Theming". Its sections:'
            );
            expect(getDocsPage(context, "buton")).toBe(
                'No page is called "buton". Did you mean "button"? list_components lists every page.'
            );
        });
    });

    describe("getApi", () => {
        it("finds a symbol by name, selector, element, pipe or exportAs", () => {
            for (const name of ["GridComponent", "mona-grid", "<mona-grid>", "gridcomponent"]) {
                expect(getApi(context, name)).toMatch(/^# GridComponent\n/);
            }
            expect(getApi(context, "monaButton")).toMatch(/^# ButtonDirective/);
            expect(getApi(context, "[monaTooltip]")).toMatch(/^# TooltipDirective/);
            expect(getApi(context, "monaSlice")).toMatch(/^# SlicePipe/);
            expect(getApi(context, "monaPopover")).toMatch(/^# PopoverComponent/);
        });

        it("shows how to import and bind it", () => {
            const text = getApi(context, "TextBoxComponent");

            expect(text).toContain("Component from `@nanahoshi/mona-ui/text-box`, selector `mona-text-box`.");
            expect(text).toContain('import { TextBoxComponent } from "@nanahoshi/mona-ui/text-box";');
            expect(text).toContain("- `[(value)]`: `string`: Its value.");
            expect(text).toContain("- `[invalid]`: `boolean` (from FieldBase): Marks it invalid.");
            expect(text).toContain("- `(inputBlur)`: `void`: Emits on blur.");
            expect(getApi(context, "GridComponent")).toContain("- `[data]`: `readonly T[]` (required): The rows.");
            expect(getApi(context, "ButtonDirective")).toContain("- `[class]`: `string` (property `userClass`)");
            expect(getApi(context, "GridCellTemplateDirective")).toContain(
                "## Template context (`GridCellTemplateContext<T>`"
            );
        });

        it("lists an entry point's exports", () => {
            const text = getApi(context, "grid");

            expect(text).toMatch(/^# @nanahoshi\/mona-ui\/grid\n\nDocs: Grid \(page "grid"\)/);
            expect(text).toContain("- **GridComponent** (component) `mona-grid`: Shows data in rows and columns.");
            expect(getApi(context, "Grid")).toBe(text);
            expect(getApi(context, "@nanahoshi/mona-ui/grid")).toBe(text);
        });

        it("suggests close names for an unknown one", () => {
            expect(getApi(context, "GridComponnet")).toContain(
                'Nothing in the Mona UI 1.2.3 API is called "GridComponnet". Did you mean `GridComponent`?'
            );
        });
    });

    describe("checkTemplate", () => {
        it("lists problems with their positions, then the imports", () => {
            const text = checkTemplate(context, `<mona-grid [data]="rows" [pageSzie]="5"></mona-grid>`);

            expect(text).toContain("1 error:\n\n- 1:");
            expect(text).toContain('import { GridComponent } from "@nanahoshi/mona-ui/grid";');
        });

        it("says when there are no problems", () => {
            expect(checkTemplate(context, `<button monaButton>Go</button>`)).toMatch(/^No problems found/);
        });
    });
});
