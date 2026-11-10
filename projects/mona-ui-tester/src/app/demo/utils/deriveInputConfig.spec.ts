import { describe, expect, it } from "vitest";
import { ComponentMetadata, ComponentPropertyMetadata } from "../models/ComponentMetadata";
import { deriveInputConfig, normalizeOptionalValues, OPTIONAL_BOOLEAN_CHOICES } from "./deriveInputConfig";

function metadataWith(inputs: ComponentPropertyMetadata[]): ComponentMetadata {
    return { name: "Test", selector: '"mona-test"', inputs };
}

function prop(overrides: Partial<ComponentPropertyMetadata> & Pick<ComponentPropertyMetadata, "name" | "type">) {
    return { description: "", kind: "input", ...overrides } as ComponentPropertyMetadata;
}

describe("deriveInputConfig", () => {
    it("classifies a boolean input and coerces its default", () => {
        const metadata = metadataWith([prop({ name: "disabled", type: "boolean", defaultValue: "false" })]);
        expect(deriveInputConfig(metadata, {})).toEqual({
            disabled: { type: "boolean", value: false }
        });
    });

    it("classifies a string input and coerces a quoted default", () => {
        const metadata = metadataWith([prop({ name: "placeholder", type: "string", defaultValue: '""' })]);
        expect(deriveInputConfig(metadata, {})).toEqual({
            placeholder: { type: "string", value: "" }
        });
    });

    it("classifies a plain number input", () => {
        const metadata = metadataWith([prop({ name: "decimals", type: "number", defaultValue: "0" })]);
        expect(deriveInputConfig(metadata, {})).toEqual({
            decimals: { type: "number", nullable: false, value: 0 }
        });
    });

    it("classifies a nullable number union and defaults to null with no metadata default", () => {
        const metadata = metadataWith([prop({ name: "maxValue", type: "number | null" })]);
        expect(deriveInputConfig(metadata, {})).toEqual({
            maxValue: { type: "number", nullable: true, value: null }
        });
    });

    it("classifies a quoted string-literal union as a dropdown", () => {
        const metadata = metadataWith([
            prop({ name: "rounded", type: '"none" | "small" | "medium" | "large"', defaultValue: "`medium`" })
        ]);
        expect(deriveInputConfig(metadata, {})).toEqual({
            rounded: { type: "dropdown", value: ["none", "small", "medium", "large"], defaultValue: "medium" }
        });
    });

    it("falls back to the first dropdown option when there is no coercible default", () => {
        const metadata = metadataWith([prop({ name: "size", type: '"small" | "medium" | "large"' })]);
        expect(deriveInputConfig(metadata, {})).toEqual({
            size: { type: "dropdown", value: ["small", "medium", "large"], defaultValue: "small" }
        });
    });

    it("omits inputs whose type can't be classified", () => {
        const metadata = metadataWith([
            prop({ name: "formatter", type: "Action<number | null, string> | null" }),
            prop({ name: "data", type: "Iterable<TData>" }),
            prop({ name: "disabled", type: "boolean" })
        ]);
        expect(deriveInputConfig(metadata, {})).toEqual({
            disabled: { type: "boolean", value: false }
        });
    });

    it("ignores output-kind metadata entries", () => {
        const metadata = metadataWith([{ description: "", kind: "output", name: "click", type: "void" }]);
        expect(deriveInputConfig(metadata, {})).toEqual({});
    });

    it("lets overrides fully replace a derived entry", () => {
        const metadata = metadataWith([prop({ name: "decimals", type: "number", defaultValue: "0" })]);
        const result = deriveInputConfig(metadata, {
            decimals: { type: "number", value: 2, min: 0, max: 10 }
        });
        expect(result).toEqual({
            decimals: { type: "number", value: 2, min: 0, max: 10 }
        });
    });

    it("lets overrides add keys that had no metadata entry", () => {
        const metadata = metadataWith([prop({ name: "disabled", type: "boolean" })]);
        const result = deriveInputConfig(metadata, {
            formatter: { type: "function", value: (value: number | null) => String(value) }
        });
        expect(result).toEqual({
            disabled: { type: "boolean", value: false },
            formatter: { type: "function", value: expect.any(Function) }
        });
    });

    describe("with resolveAliases", () => {
        it("leaves aliases and optional primitives out unless asked", () => {
            const metadata = metadataWith([
                prop({ name: "curve", type: "ChartCurve", options: ["linear", "step"], defaultValue: '"linear"' }),
                prop({ name: "pointRadius", type: "number | undefined" })
            ]);
            expect(deriveInputConfig(metadata, {})).toEqual({});
        });

        it("makes a dropdown from an alias's resolved options", () => {
            const metadata = metadataWith([
                prop({ name: "curve", type: "ChartCurve", options: ["linear", "step"], defaultValue: '"linear"' })
            ]);
            expect(deriveInputConfig(metadata, {}, { resolveAliases: true })).toEqual({
                curve: { type: "dropdown", value: ["linear", "step"], defaultValue: "linear" }
            });
        });

        it("lets an optional alias be cleared", () => {
            const metadata = metadataWith([
                prop({ name: "side", type: "ChartYAxisSide | undefined", options: ["start", "end"] })
            ]);
            expect(deriveInputConfig(metadata, {}, { resolveAliases: true })).toEqual({
                side: {
                    type: "dropdown",
                    clearable: true,
                    value: ["start", "end"],
                    defaultValue: null,
                    placeholder: "Automatic"
                }
            });
        });

        it("classifies optional numbers, strings and booleans", () => {
            const metadata = metadataWith([
                prop({ name: "pointRadius", type: "number | undefined" }),
                prop({ name: "axisId", type: "string | undefined" }),
                prop({ name: "gridLines", type: "boolean | undefined" })
            ]);
            expect(deriveInputConfig(metadata, {}, { resolveAliases: true })).toEqual({
                pointRadius: { type: "number", nullable: true, value: null },
                axisId: { type: "string", value: "" },
                gridLines: {
                    type: "customDropdown",
                    value: OPTIONAL_BOOLEAN_CHOICES,
                    textField: "text",
                    valueField: "value",
                    defaultValue: undefined
                }
            });
        });
    });
});

describe("normalizeOptionalValues", () => {
    it("turns cleared values back into undefined only where the input takes undefined", () => {
        const metadata = metadataWith([
            prop({ name: "pointRadius", type: "number | undefined" }),
            prop({ name: "axisId", type: "string | undefined" }),
            prop({ name: "maxValue", type: "number | null" }),
            prop({ name: "title", type: "string" })
        ]);
        expect(normalizeOptionalValues(metadata, { pointRadius: null, axisId: "", maxValue: null, title: "" })).toEqual(
            {
                pointRadius: undefined,
                axisId: undefined,
                maxValue: null,
                title: ""
            }
        );
    });
});
