import { Project } from "ts-morph";
import { describe, expect, it } from "vitest";
import type { DocsPage } from "../src/app/layout/docs-manifest";
import { readEntryPoint } from "./api-extractor";
import type { ApiSymbol } from "./api-extractor";
import {
    buildApiReference,
    renderApiPage,
    renderApiReference,
    selectPageEntries,
    sortSymbols
} from "./generate-api-docs";
import type { ApiIndex } from "./generate-api-docs";

function readSource(source: string): ApiSymbol[] {
    const project = new Project({ useInMemoryFileSystem: true });
    return readEntryPoint(project.createSourceFile("public-api.ts", source));
}

const NO_INDEX: ApiIndex = new Map();

function render(symbols: readonly ApiSymbol[], index: ApiIndex = NO_INDEX): string {
    return renderApiPage(
        symbols.map(symbol => ({ entryPoint: "demo", symbol })),
        index
    ).markdown;
}

describe("readEntryPoint", () => {
    it("reads a component's selector, inputs, models and outputs", () => {
        const [symbol] = readSource(`
            /** Shows a demo. */
            @Component({ selector: "mona-demo", exportAs: "monaDemo" })
            export class DemoComponent {
                /** @description The size. */
                public readonly size = input<"large" | "small">("small");
                /** Named in the template by its alias. */
                public readonly ariaLabel = input("", { alias: "aria-label" });
                /** @description Needed. */
                public readonly target = input.required<Element>();
                /** @description Binds both ways. */
                public readonly value = model<string>("");
                /** @description Fires. */
                public readonly closed = output<void>();
            }
        `);

        expect(symbol).toMatchObject({
            description: "Shows a demo.",
            exportAs: "monaDemo",
            kind: "component",
            name: "DemoComponent",
            selector: "mona-demo"
        });
        expect(symbol.inputs?.map(input => input.alias ?? input.name)).toEqual([
            "aria-label",
            "size",
            "target",
            "value"
        ]);
        expect(symbol.inputs?.find(input => input.name === "size")).toMatchObject({
            defaultValue: '"small"',
            description: "The size.",
            type: '"large" | "small"'
        });
        expect(symbol.inputs?.find(input => input.name === "target")).toMatchObject({ required: true });
        expect(symbol.inputs?.find(input => input.name === "value")).toMatchObject({ twoWay: true });
        expect(symbol.outputs?.map(output => output.name)).toEqual(["closed"]);
    });

    it("trusts a literal in the code over a default tag, and keeps the tag for an expression", () => {
        const [symbol] = readSource(`
            @Component({ selector: "mona-demo" })
            export class DemoComponent {
                /** @default "stale" */
                public readonly literal = input("current");
                /** @default "computed" */
                public readonly expression = input(makeDefault());
                public readonly unset = input<string | undefined>(undefined);
            }
        `);

        expect(symbol.inputs?.map(input => input.defaultValue)).toEqual(['"computed"', '"current"', "undefined"]);
    });

    it("reads an output made from an observable", () => {
        const [symbol] = readSource(`
            @Component({ selector: "mona-demo" })
            export class DemoComponent {
                /** Fires. */
                public readonly fired = outputFromObservable(source);
            }
        `);

        expect(symbol.outputs?.map(output => output.name)).toEqual(["fired"]);
        expect(symbol.properties).toEqual([]);
    });

    it("leaves out an overload marked internal", () => {
        const [symbol] = readSource(`
            export class DemoRef {
                /** Refreshes it. */
                public refresh(): void;
                /** @internal */
                public refresh(reason: number): void;
                public refresh(reason = 0): void {}
            }
        `);

        expect(symbol.methods?.map(method => method.signature)).toEqual(["refresh(): void"]);
    });

    it("leaves out what is marked hidden, as it does what is internal", () => {
        const [symbol] = readSource(`
            export class DemoRef {
                /** Shown. */
                public readonly id = "a";
                /** @hidden Shared with other entry points. */
                public readonly plumbing = "b";
            }
        `);

        expect(symbol.properties?.map(property => property.name)).toEqual(["id"]);
    });

    it("keeps the line break after a link that ends a line, with LF and CRLF alike", () => {
        const source = [
            "export class DemoRef {",
            "    /**",
            "     * @description Use {@link other}",
            "     * there.",
            "     */",
            "    public readonly id = \"a\";",
            "}"
        ];
        for (const newline of ["\n", "\r\n"]) {
            const [symbol] = readSource(source.join(newline));
            expect(symbol.properties?.[0].description.replace(/\s+/g, " ")).toBe("Use {@link other} there.");
        }
    });

    it("treats only documented members of a component as API", () => {
        const [symbol] = readSource(`
            @Directive({ selector: "[monaDemo]" })
            export class DemoDirective {
                /** Opens it. */
                public open(): void {}
                public getInternals(): void {}
                public readonly origin = "demo";
                /** @internal */
                public hidden(): void {}
                public ngOnInit(): void {}
                #secret(): void {}
                protected shown(): void {}
            }
        `);

        expect(symbol.methods?.map(method => method.name)).toEqual(["open"]);
        expect(symbol.properties).toEqual([]);
    });

    it("lists everything public on a plain class", () => {
        const [symbol] = readSource(`
            export class DemoRef {
                public readonly id = "a";
                public close(): void {}
            }
        `);

        expect(symbol.kind).toBe("class");
        expect(symbol.methods?.map(method => method.signature)).toEqual(["close(): void"]);
        expect(symbol.properties?.map(property => property.name)).toEqual(["id"]);
    });

    it("reads a class's constructor parameter properties", () => {
        const [symbol] = readSource(`
            export class DemoEvent {
                public constructor(public readonly value: string, private readonly secret: string, plain: string) {}
            }
        `);

        expect(symbol.properties).toEqual([{ description: "", name: "value", readonly: true, type: "string" }]);
    });

    it("reads a directive's template context from its guard", () => {
        const [, symbol] = readSource(`
            export interface DemoContext {
                /** The item. */
                $implicit: string;
                index: number;
            }
            @Directive({ selector: "ng-template[monaDemo]" })
            export class DemoTemplateDirective {
                public static ngTemplateContextGuard(_: unknown, ctx: unknown): ctx is DemoContext {
                    return true;
                }
            }
        `);

        expect(symbol.templateContext?.type).toBe("DemoContext");
        expect(symbol.templateContext?.members.map(member => member.name)).toEqual(["$implicit", "index"]);
        expect(symbol.templateContext?.members[0].description).toBe("The item.");
    });

    it("reads types and leaves out internal and styling exports", () => {
        const symbols = readSource(`
            /** A position. */
            export type DemoPosition = "start" | "end";
            export type DemoVariantProps = { size: string };
            /** @internal */
            export type DemoSecret = string;
            export enum DemoKind { A = "a" }
            /** Makes one. */
            export function createDemo(name: string): void {}
            export interface DemoOptions {
                /** Its name. */
                readonly name?: string;
            }
        `);

        expect(symbols.map(symbol => symbol.name).sort()).toEqual(
            ["DemoKind", "DemoOptions", "DemoPosition", "createDemo"].sort()
        );
        expect(symbols.find(symbol => symbol.name === "DemoPosition")?.signature).toBe(
            'type DemoPosition = "start" | "end";'
        );
        expect(symbols.find(symbol => symbol.name === "createDemo")?.signature).toBe(
            "function createDemo(name: string): void;"
        );
        expect(symbols.find(symbol => symbol.name === "DemoKind")?.enumMembers).toEqual([
            { description: "", name: "A", value: '"a"' }
        ]);
        expect(symbols.find(symbol => symbol.name === "DemoOptions")?.properties?.[0]).toMatchObject({
            description: "Its name.",
            optional: true,
            readonly: true
        });
    });
});

describe("renderApiPage", () => {
    const component: ApiSymbol = {
        description: "Shows a demo.",
        inputs: [
            { description: "Needed.", name: "target", required: true, type: "Element" },
            { defaultValue: '""', description: "Either way.", name: "value", twoWay: true, type: "string | number" }
        ],
        kind: "component",
        name: "DemoComponent",
        outputs: [{ description: "Fires.", name: "closed", type: "void" }],
        selector: "mona-demo"
    };

    it("marks generated output, and says where to import from", () => {
        const markdown = render([component]);

        expect(markdown).toContain("Generated by npm run generate:api-docs");
        expect(markdown).toContain("## API");
        expect(markdown).toContain("`@nanahoshi/mona-ui/demo`");
    });

    it("renders a component's tables, with a model's change event", () => {
        const markdown = render([component]);

        expect(markdown).toContain("### `DemoComponent`");
        expect(markdown).toContain("**Selector:** `mona-demo`");
        expect(markdown).toContain("| `target` (required) | `Element` | — | Needed. |");
        expect(markdown).toContain('| `value` (two-way) | `string \\| number` | `""` | Either way. |');
        expect(markdown).toContain("| `closed` | `void` | Fires. |");
        expect(markdown).toContain("| `valueChange` | `string \\| number` | Emitted when `value` changes. |");
    });

    it("keeps a table in one row per member", () => {
        const markdown = render([
            {
                description: "",
                inputs: [{ description: "One.\nTwo | three.", name: "a", type: "string" }],
                kind: "directive",
                name: "D"
            }
        ]);

        expect(markdown).toContain("| `a` | `string` | — | One. Two \\| three. |");
    });

    it("turns link tags into code", () => {
        expect(render([{ description: "See {@link DemoRef}.", kind: "class", name: "A" }])).toContain("See `DemoRef`.");
    });

    it("escapes a tag in a description, and leaves one in code or for formatting alone", () => {
        const markdown = render([
            {
                description: "Adds <title> and `<desc>` when a < b.",
                kind: "class",
                name: "DemoWriter",
                properties: [
                    { description: "Writes <title>, not ``<desc>``, every n<sup>th</sup>.", name: "a", type: "boolean" }
                ]
            }
        ]);

        expect(markdown).toContain("Adds \\<title> and `<desc>` when a \\< b.");
        expect(markdown).toContain("| `a` | `boolean` | Writes \\<title>, not ``<desc>``, every n<sup>th</sup>. |");
    });

    it("leaves out a description column nothing fills", () => {
        const markdown = render([
            {
                description: "",
                kind: "class",
                name: "DemoOptions",
                properties: [{ description: "", name: "a", type: "string" }]
            }
        ]);

        expect(markdown).toContain("| Name | Type |\n| --- | --- |\n| `a` | `string` |");
    });

    it("links each component to its reference page", () => {
        expect(render([component])).toContain("**API reference:** [`DemoComponent`](/api/demo/DemoComponent)");
    });

    it("lists the page's types in one table, each linking to its reference page", () => {
        const markdown = render([
            component,
            {
                description: "A position. Either end.",
                kind: "type",
                name: "DemoPosition",
                signature: 'type DemoPosition = "start";'
            }
        ]);

        expect(markdown).toContain(
            "### Types\n\n| Type | Kind | Description |\n| --- | --- | --- |\n" +
                "| [`DemoPosition`](/api/demo/DemoPosition) | Type alias | A position. |"
        );
        expect(markdown).not.toContain("type DemoPosition =");
    });

    it("links the types a page uses from elsewhere, and what a type with no page uses in turn", () => {
        const noPage: ApiSymbol = { description: "", kind: "type", name: "Shared", signature: "type Shared = Nested;" };
        const nested: ApiSymbol = { description: "", kind: "type", name: "Nested", signature: "type Nested = string;" };
        const elsewhere: ApiSymbol = {
            description: "",
            kind: "type",
            name: "Other",
            signature: "type Other = string;"
        };
        const index: ApiIndex = new Map([
            ["Nested", { entryPoint: "common", symbol: nested }],
            ["Other", { entryPoint: "popup", page: "popup", symbol: elsewhere }],
            ["Shared", { entryPoint: "common", symbol: noPage }]
        ]);
        const markdown = render(
            [
                {
                    description: "",
                    inputs: [{ description: "", name: "a", type: "Shared | Other" }],
                    kind: "directive",
                    name: "D"
                }
            ],
            index
        );

        expect(markdown).toContain(
            "**Related types:** [`Nested`](/api/common/Nested), [`Other`](/api/popup/Other), [`Shared`](/api/common/Shared)"
        );
    });

    it("reports a type no entry point exports", () => {
        const rendered = renderApiPage(
            [
                {
                    entryPoint: "demo",
                    symbol: {
                        description: "",
                        inputs: [{ description: "", name: "a", type: "Hidden<TData>" }],
                        kind: "directive",
                        name: "D",
                        typeParameters: ["TData"]
                    }
                }
            ],
            NO_INDEX
        );

        expect(rendered.unexported).toEqual(["Hidden"]);
    });
});

describe("sortSymbols", () => {
    it("puts components first, largest first, and types last", () => {
        const symbols: ApiSymbol[] = [
            { description: "", kind: "type", name: "AType" },
            { description: "", kind: "component", name: "SmallComponent" },
            {
                description: "",
                inputs: [{ description: "", name: "a", type: "string" }],
                kind: "component",
                name: "MainComponent"
            }
        ];

        expect(sortSymbols(symbols).map(symbol => symbol.name)).toEqual(["MainComponent", "SmallComponent", "AType"]);
    });
});

describe("selectPageEntries", () => {
    const symbols = new Map<string, readonly ApiSymbol[]>([
        [
            "shared",
            [
                { description: "", kind: "directive", name: "A" },
                { description: "", kind: "directive", name: "B" }
            ]
        ],
        [
            "extra",
            [
                { description: "", kind: "directive", name: "C" },
                { description: "", kind: "directive", name: "A" }
            ]
        ]
    ]);
    const page = (api: Partial<DocsPage>): DocsPage => ({
        description: "",
        entryPoint: "shared",
        kind: "component",
        path: "page",
        title: "Page",
        ...api
    });

    it("takes the whole entry point by default", () => {
        expect(selectPageEntries(page({}), symbols).map(entry => entry.symbol.name)).toEqual(["A", "B"]);
    });

    it("narrows to a page's exports when pages share an entry point", () => {
        expect(selectPageEntries(page({ apiExports: ["B"] }), symbols).map(entry => entry.symbol.name)).toEqual(["B"]);
    });

    it("gives a page without exports what the entry point's other pages don't name", () => {
        const overview = page({});
        const family = page({ apiExports: ["B"], path: "family" });

        expect(selectPageEntries(overview, symbols, [overview, family]).map(entry => entry.symbol.name)).toEqual([
            "A"
        ]);
    });

    it("adds another entry point without repeating a name", () => {
        const entries = selectPageEntries(page({ apiAlsoFrom: ["extra"] }), symbols);

        expect(entries.map(entry => `${entry.entryPoint}:${entry.symbol.name}`)).toEqual([
            "shared:A",
            "shared:B",
            "extra:C"
        ]);
    });
});

describe("buildApiReference", () => {
    const base: ApiSymbol = {
        description: "Shared options. More detail.",
        kind: "interface",
        name: "BaseOptions",
        properties: [{ description: "The width.", name: "width", optional: true, type: "number" }]
    };
    const derived: ApiSymbol = {
        description: "PNG options.",
        extends: ["BaseOptions"],
        kind: "interface",
        name: "PngOptions",
        properties: [{ description: "See `Mode`.", name: "mode", type: "Mode" }]
    };
    const mode: ApiSymbol = { description: "", kind: "type", name: "Mode", signature: 'type Mode = "a";' };
    const otherMode: ApiSymbol = { description: "", kind: "type", name: "Mode", signature: 'type Mode = "b";' };
    const symbolsByEntry = new Map<string, readonly ApiSymbol[]>([
        ["export", [base, derived, mode]],
        ["other", [otherMode]],
        ["src", []]
    ]);
    const index: ApiIndex = new Map([
        ["BaseOptions", { entryPoint: "export", page: "exporting", symbol: base }],
        ["Mode", { entryPoint: "other", symbol: otherMode }],
        ["PngOptions", { entryPoint: "export", page: "exporting", symbol: derived }]
    ]);
    const pages: DocsPage[] = [
        { description: "", entryPoint: "export", kind: "component", path: "exporting", title: "Exporting" }
    ];
    const reference = buildApiReference(symbolsByEntry, index, pages);
    const exported = reference.entryPoints.find(entryPoint => entryPoint.name === "export");
    const symbol = (name: string) => exported?.symbols.find(item => item.name === name);

    it("leaves out an entry point that exports nothing", () => {
        expect(reference.entryPoints.map(entryPoint => entryPoint.name)).toEqual(["export", "other"]);
    });

    it("gives a symbol the members of its exported base, and the base the names that use it", () => {
        expect(symbol("PngOptions")?.inherited).toEqual([{ from: "BaseOptions", properties: base.properties }]);
        expect(symbol("BaseOptions")?.usedBy).toEqual(["PngOptions"]);
    });

    it("links a name to its own entry point's export before another entry point's", () => {
        expect(exported?.links).toEqual({ BaseOptions: "export", Mode: "export", PngOptions: "export" });
    });

    it("names the guide page, and summarizes each symbol in the index", () => {
        expect(symbol("BaseOptions")?.page).toEqual({ path: "exporting", title: "Exporting" });
        expect(exported?.pages).toEqual([{ path: "exporting", title: "Exporting" }]);
        expect(reference.index.entryPoints[0].symbols.find(item => item.name === "BaseOptions")?.summary).toBe(
            "Shared options."
        );
    });

    it("renders an entry point's whole reference as markdown", () => {
        const markdown = exported ? renderApiReference(exported) : "";

        expect(markdown).toContain("# `@nanahoshi/mona-ui/export`");
        expect(markdown).toContain("**Guides:** [Exporting](/components/exporting)");
        expect(markdown).toContain("## `PngOptions`\n\nInterface.\n\nPNG options.");
        expect(markdown).toContain("### Inherited from `BaseOptions`");
        expect(markdown).toContain("**Used by:** [`PngOptions`](/api/export/PngOptions)");
    });
});
