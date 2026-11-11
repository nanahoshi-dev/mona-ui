import { describe, expect, it } from "vitest";
import type { DemoPart } from "./demoParts";
import { generatePartsCodeSample } from "./demoParts";

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
});
