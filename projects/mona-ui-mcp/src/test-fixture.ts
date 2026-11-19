import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ApiEntryPoint, ApiSymbol, DocsManifest, ExportedSymbol } from "./docs-data.js";

/** A few symbols shaped like the real API reference, for the specs. */
export const FIXTURE_ENTRY_POINTS: readonly ApiEntryPoint[] = [
    {
        name: "button",
        pages: [{ path: "button", title: "Button" }],
        symbols: [
            {
                description: "Styles a native button.",
                inputs: [
                    { defaultValue: "false", description: "Disables the button.", name: "disabled", type: "boolean" },
                    {
                        defaultValue: '"default"',
                        description: "The look.",
                        name: "look",
                        type: '"default" | "primary"'
                    },
                    { alias: "class", description: "Classes merged onto the host.", name: "userClass", type: "string" }
                ],
                kind: "directive",
                name: "ButtonDirective",
                page: { path: "button", title: "Button" },
                selector: "button[monaButton]"
            }
        ]
    },
    {
        name: "common",
        pages: [],
        symbols: [{ description: "Slices an array.", kind: "pipe", name: "SlicePipe", pipeName: "monaSlice" }]
    },
    {
        name: "grid",
        pages: [{ path: "grid", title: "Grid" }],
        symbols: [
            {
                description: "Shows data in rows and columns.",
                inputs: [
                    { description: "The rows.", name: "data", required: true, type: "readonly T[]" },
                    { defaultValue: "10", description: "Rows per page.", name: "pageSize", type: "number" }
                ],
                kind: "component",
                name: "GridComponent",
                outputs: [{ description: "Emits the new page.", name: "pageChange", type: "number" }],
                page: { path: "grid", title: "Grid" },
                selector: "mona-grid"
            },
            {
                description: "A column of the grid.",
                inputs: [
                    { description: "The field it shows.", name: "field", required: true, type: "string" },
                    { description: "The header.", name: "title", type: "string" }
                ],
                kind: "component",
                name: "GridColumnComponent",
                selector: "mona-grid-column"
            },
            {
                description: "",
                inputs: [{ description: "What to edit.", name: "monaGridEditable", type: '"cell" | "row" | ""' }],
                kind: "directive",
                name: "GridEditableDirective",
                page: { path: "grid", title: "Grid" },
                selector: "mona-grid[monaGridEditable]"
            },
            {
                description: "Draws a cell.",
                kind: "directive",
                name: "GridCellTemplateDirective",
                selector: "ng-template[monaGridCellTemplate]",
                templateContext: {
                    members: [{ description: "The row's data.", name: "$implicit", type: "T" }],
                    type: "GridCellTemplateContext<T>"
                }
            },
            {
                description: "Options for the grid.",
                kind: "interface",
                name: "GridOptions",
                properties: [{ description: "Rows per page.", name: "pageSize", optional: true, type: "number" }]
            }
        ]
    },
    {
        name: "popover",
        pages: [{ path: "popover", title: "Popover" }],
        symbols: [
            {
                description: "Shows content next to an anchor.",
                exportAs: "monaPopover",
                kind: "component",
                name: "PopoverComponent",
                selector: "mona-popover"
            },
            {
                description: "Shows a tooltip.",
                inputs: [{ description: "The text.", name: "monaTooltip", required: true, type: "string" }],
                kind: "directive",
                name: "TooltipDirective",
                selector: "[monaTooltip]"
            }
        ]
    },
    {
        name: "text-box",
        pages: [{ path: "text-box", title: "Text Box" }],
        symbols: [
            {
                description: "A text field.",
                inherited: [
                    {
                        from: "FieldBase",
                        inputs: [{ description: "Marks it invalid.", name: "invalid", type: "boolean" }]
                    }
                ],
                inputs: [
                    { description: "Its value.", name: "value", twoWay: true, type: "string" },
                    { description: "Shown when empty.", name: "placeholder", type: "string" },
                    { description: "The most characters.", name: "maxLength", type: "number | null" }
                ],
                kind: "component",
                name: "TextBoxComponent",
                outputs: [{ description: "Emits on blur.", name: "inputBlur", type: "void" }],
                selector: "mona-text-box"
            }
        ]
    }
];

export function fixtureSymbols(): ExportedSymbol[] {
    return FIXTURE_ENTRY_POINTS.flatMap(entryPoint =>
        entryPoint.symbols.map((symbol: ApiSymbol) => ({ entryPoint: entryPoint.name, symbol }))
    );
}

const BUTTON_PAGE = `# Button

> Styles a native button.

Entry point: \`@nanahoshi/mona-ui/button\`

Buttons trigger actions.

## Examples

### Looks

\`looks-example.component.html\`

\`\`\`html
<button monaButton look="primary">Save</button>
## Not a heading, it's in code
\`\`\`

### Loading

Show a spinner while saving.

## Accessibility

Keyboard users press Enter or Space.
`;

/** A grid page longer than a page that comes back whole. */
const GRID_PAGE = `# Grid

> Shows data in rows and columns.

Entry point: \`@nanahoshi/mona-ui/grid\`

The grid pages, sorts and edits.

## Editing

### Inline editing

Edit a row in place with \`monaGridEditable\`.

## Paging

${"Rows come a page at a time. ".repeat(1000)}
`;

/** Writes a package-shaped folder with the fixture's docs, and returns it. */
export function writeFixturePackage(version = "1.2.3"): string {
    const root = mkdtempSync(join(tmpdir(), "mona-ui-mcp-"));
    mkdirSync(join(root, "docs", "api"), { recursive: true });
    const manifest: DocsManifest = {
        essentials: "## Essentials\n\n- Import from entry points.",
        pages: [
            {
                category: "Actions",
                description: "Styles a native button.",
                entryPoint: "button",
                file: "docs/button.md",
                kind: "component",
                path: "button",
                slug: "button",
                title: "Button"
            },
            {
                category: "Data",
                description: "Shows data in rows and columns.",
                entryPoint: "grid",
                file: "docs/grid.md",
                kind: "component",
                path: "grid",
                slug: "grid",
                title: "Grid"
            }
        ],
        schemaVersion: 1,
        version
    };
    writeFileSync(join(root, "package.json"), JSON.stringify({ name: "@nanahoshi/mona-ui", version }));
    writeFileSync(join(root, "docs", "manifest.json"), JSON.stringify(manifest));
    writeFileSync(join(root, "docs", "button.md"), BUTTON_PAGE);
    writeFileSync(join(root, "docs", "grid.md"), GRID_PAGE);
    writeFileSync(
        join(root, "docs", "api", "index.json"),
        JSON.stringify({
            entryPoints: FIXTURE_ENTRY_POINTS.map(entryPoint => ({
                name: entryPoint.name,
                pages: entryPoint.pages,
                symbols: entryPoint.symbols.map(symbol => ({ kind: symbol.kind, name: symbol.name, summary: "" }))
            }))
        })
    );
    for (const entryPoint of FIXTURE_ENTRY_POINTS) {
        writeFileSync(
            join(root, "docs", "api", `${entryPoint.name}.json`),
            JSON.stringify({ ...entryPoint, links: {} })
        );
    }
    return root;
}
