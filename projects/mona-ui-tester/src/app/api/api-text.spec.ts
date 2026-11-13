import { describe, expect, it } from "vitest";
import type { ApiSymbolReference } from "./api-model";
import {
    apiSections,
    importStatement,
    mentionedNames,
    prose,
    selectorAlternatives,
    summarize,
    typeTokens
} from "./api-text";

describe("api-text", () => {
    it("escapes a tag in a description, and keeps code spans and formatting tags", () => {
        expect(prose("Adds <title> and `<desc>`, every n<sup>th</sup>, when a < b. See {@link ChartPoint}.")).toBe(
            "Adds \\<title> and `<desc>`, every n<sup>th</sup>, when a \\< b. See `ChartPoint`."
        );
    });

    it("summarizes a description by its first sentence", () => {
        expect(summarize("Shared options. More detail follows.\n\nA second paragraph.")).toBe("Shared options.");
        expect(summarize("One line\nwrapped over two")).toBe("One line wrapped over two");
        expect(summarize("")).toBe("");
    });

    it("finds the names a type mentions outside string literals", () => {
        expect(mentionedNames('readonly ChartPoint<T>[] | "Literal" | Map<string, ChartAxis>')).toEqual([
            "ChartPoint",
            "T",
            "Map",
            "ChartAxis"
        ]);
    });

    it("splits a type so each exported name links, but not the symbol itself or a string literal", () => {
        const links = { ChartAxis: "chart", ChartPoint: "chart" };

        expect(typeTokens('ChartPoint | "ChartAxis" | ChartAxis[]', links, "ChartPoint")).toEqual([
            { text: 'ChartPoint | "ChartAxis" | ' },
            { entryPoint: "chart", text: "ChartAxis" },
            { text: "[]" }
        ]);
    });

    it("gives each section and member a unique anchor, with a model's change event among the outputs", () => {
        const symbol: ApiSymbolReference = {
            description: "",
            inherited: [{ from: "BaseOptions", properties: [{ description: "", name: "width", type: "number" }] }],
            inputs: [
                { description: "", name: "value", twoWay: true, type: "string" },
                { description: "", name: "signature", required: true, type: "string" }
            ],
            kind: "component",
            name: "Demo",
            outputs: [{ description: "Fires.", name: "closed", type: "void" }]
        };

        const sections = apiSections(symbol);

        expect(sections.map(section => [section.id, section.kind, section.title])).toEqual([
            ["inputs", "inputs", "Inputs"],
            ["outputs", "outputs", "Outputs"],
            ["inherited-from-baseoptions", "inherited", "Inherited from BaseOptions"]
        ]);
        expect(sections[0].items.map(item => [item.id, item.flags])).toEqual([
            ["value", ["two-way"]],
            ["signature-2", ["required"]]
        ]);
        expect(sections[1].items.map(item => item.name)).toEqual(["closed", "valueChange"]);
        expect(sections[2].from).toBe("BaseOptions");
    });

    it("imports types as types", () => {
        expect(importStatement({ kind: "interface", name: "ChartPoint" }, "chart")).toBe(
            'import type { ChartPoint } from "@nanahoshi/mona-ui/chart";'
        );
        expect(importStatement({ kind: "component", name: "ChartComponent" }, "chart")).toBe(
            'import { ChartComponent } from "@nanahoshi/mona-ui/chart";'
        );
    });

    it("splits a selector list into its selectors, leaving a comma inside brackets alone", () => {
        expect(selectorAlternatives("mona-a[monaD],  b[type='x,y'][monaD]")).toEqual([
            "mona-a[monaD]",
            "b[type='x,y'][monaD]"
        ]);
    });
});
