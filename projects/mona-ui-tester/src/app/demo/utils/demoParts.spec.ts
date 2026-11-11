import { signal } from "@angular/core";
import { describe, expect, it } from "vitest";
import type { DemoPart } from "./demoParts";
import { generatePartsCodeSample } from "./demoParts";
import type { FeatureConfigHandler } from "./featureInjection";

function part(id: string, selector: string, extra: Partial<DemoPart> = {}): DemoPart {
    return {
        config: { inputs: {} },
        id,
        metadata: { inputs: [], name: id, selector },
        title: id,
        ...extra
    };
}

describe("generatePartsCodeSample", () => {
    it("writes a host part as attributes of the root, and a child part inside it", () => {
        const code = generatePartsCodeSample(
            [
                part("grid", "mona-grid", { codeAttributes: ['[data]="orders"'] }),
                part("column", "mona-grid-column", { codeAttributes: ['field="freight"'] }),
                part("virtual", "mona-grid[monaGridVirtualScroll]", {
                    config: { inputs: { scrollEndThreshold: { type: "number", value: 5 } } },
                    placement: "host"
                })
            ],
            { grid: {}, column: {}, virtual: { scrollEndThreshold: 10 } }
        );

        expect(code).toBe(
            [
                '<mona-grid [data]="orders" monaGridVirtualScroll [scrollEndThreshold]="10">',
                '    <mona-grid-column field="freight"></mona-grid-column>',
                "</mona-grid>"
            ].join("\n")
        );
    });

    it("leaves out a value the input already defaults to", () => {
        const code = generatePartsCodeSample(
            [
                part("column", "mona-grid-column", {
                    codeAttributes: ['field="freight"'],
                    config: {
                        inputs: {
                            minWidth: { type: "number", value: 40 },
                            width: { type: "number", value: 120 }
                        }
                    },
                    metadata: {
                        inputs: [
                            { defaultValue: "40", description: "", kind: "input", name: "minWidth", type: "number" },
                            { description: "", kind: "input", name: "width", type: "number | null" }
                        ],
                        name: "column",
                        selector: "mona-grid-column"
                    }
                })
            ],
            { column: {} }
        );

        expect(code).toBe('<mona-grid-column field="freight" [width]="120"></mona-grid-column>');
    });

    it("leaves out the bare attribute when the host part binds its options", () => {
        const code = generatePartsCodeSample(
            [
                part("grid", "mona-grid"),
                part("sorting", "mona-grid[monaGridSortable]", {
                    codeAttributes: ["[monaGridSortable]=\"{ mode: 'multiple' }\""],
                    placement: "host"
                })
            ],
            { grid: {}, sorting: {} }
        );

        expect(code).toBe(`<mona-grid [monaGridSortable]="{ mode: 'multiple' }"></mona-grid>`);
    });

    it("writes a feature's code at the start of its part when it asks to be", () => {
        const features = signal({
            footer: { active: true, code: "<footer monaSidebarFooter></footer>", description: "", name: "Footer" },
            header: {
                active: true,
                code: "<header monaSidebarHeader></header>",
                codePosition: "start" as const,
                description: "",
                name: "Header"
            }
        });
        const code = generatePartsCodeSample(
            [
                part("sidebar", "mona-sidebar", {
                    codeContent: ["<nav monaSidebarContent></nav>"],
                    config: { inputs: {}, featureHandler: { data: features } as unknown as FeatureConfigHandler }
                })
            ],
            {}
        );

        expect(code).toBe(
            [
                "<mona-sidebar>",
                "    <header monaSidebarHeader></header>",
                "    <nav monaSidebarContent></nav>",
                "    <footer monaSidebarFooter></footer>",
                "</mona-sidebar>"
            ].join("\n")
        );
    });

    it("nests a part inside its parent, in its wrappers and on its own element", () => {
        const code = generatePartsCodeSample(
            [
                part("layout", "mona-sidebar-layout"),
                part("sidebar", "mona-sidebar", { codeAttributes: ['collapsible="icon"'] }),
                part("item", "li[monaSidebarMenuItem]", {
                    parent: "sidebar",
                    wrappers: ['nav monaSidebarContent aria-label="Main"', "ul monaSidebarMenu"]
                }),
                part("button", "a[monaSidebarMenuButton], button[monaSidebarMenuButton]", {
                    codeAttributes: ['href="/inbox"'],
                    codeContent: ["<span>Inbox</span>"],
                    parent: "item"
                }),
                part("sent", "li[monaSidebarMenuItem]", {
                    codeContent: ['<a monaSidebarMenuButton href="/sent">Sent</a>'],
                    parent: "sidebar",
                    wrappers: ['nav monaSidebarContent aria-label="Main"', "ul monaSidebarMenu"]
                }),
                part("loading", "li[monaSidebarMenuItem]", {
                    codeContent: ["<mona-sidebar-menu-skeleton></mona-sidebar-menu-skeleton>"],
                    parent: "sidebar",
                    wrappers: ['nav monaSidebarContent aria-label="Main"', 'ul monaSidebarMenu aria-busy="true"']
                }),
                part("inset", "[monaSidebarInset]", { element: "main" }),
                part("trigger", "[monaSidebarTrigger]", {
                    codeAttributes: ['aria-label="Toggle sidebar"'],
                    element: "button",
                    parent: "inset"
                })
            ],
            {}
        );

        expect(code).toBe(
            [
                "<mona-sidebar-layout>",
                '    <mona-sidebar collapsible="icon">',
                '        <nav monaSidebarContent aria-label="Main">',
                "            <ul monaSidebarMenu>",
                "                <li monaSidebarMenuItem>",
                '                    <a monaSidebarMenuButton href="/inbox">',
                "                        <span>Inbox</span>",
                "                    </a>",
                "                </li>",
                "                <li monaSidebarMenuItem>",
                '                    <a monaSidebarMenuButton href="/sent">Sent</a>',
                "                </li>",
                "            </ul>",
                '            <ul monaSidebarMenu aria-busy="true">',
                "                <li monaSidebarMenuItem>",
                "                    <mona-sidebar-menu-skeleton></mona-sidebar-menu-skeleton>",
                "                </li>",
                "            </ul>",
                "        </nav>",
                "    </mona-sidebar>",
                "    <main monaSidebarInset>",
                '        <button monaSidebarTrigger aria-label="Toggle sidebar"></button>',
                "    </main>",
                "</mona-sidebar-layout>"
            ].join("\n")
        );
    });
});
