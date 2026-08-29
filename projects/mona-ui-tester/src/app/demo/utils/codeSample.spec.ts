import { describe, expect, it } from "vitest";
import { ComponentConfigFeatureItem, ComponentConfigFeatureItemOptions, ProcessedConfigItem } from "./componentConfig";
import { generateComponentCodeSample, generateDirectiveBindingCodeSample, generateFeatureCodeSample } from "./codeSample";

function makeItem(overrides: Partial<ProcessedConfigItem> & Pick<ProcessedConfigItem, "name" | "configType">) {
    return {
        valueType: "string",
        ...overrides
    } as ProcessedConfigItem;
}

describe("generateComponentCodeSample", () => {
    it("renders a plain element selector with no attributes when nothing is customized", () => {
        const code = generateComponentCodeSample("mona-switch", [], {});
        expect(code).toBe("<mona-switch></mona-switch>");
    });

    it("skips boolean attributes at their false baseline and includes them when true", () => {
        const items = [
            makeItem({ name: "disabled", configType: "boolean", value: false }),
            makeItem({ name: "checked", configType: "boolean", value: false })
        ];
        const code = generateComponentCodeSample("mona-switch", items, { checked: true });
        expect(code).toBe(`<mona-switch [checked]="true"></mona-switch>`);
    });

    it("formats string values with single quotes and skips empty strings", () => {
        const items = [
            makeItem({ name: "placeholder", configType: "string", value: "" }),
            makeItem({ name: "separator", configType: "string", value: "-" })
        ];
        const code = generateComponentCodeSample("mona-otp-input", items, { separator: "*" });
        expect(code).toBe(`<mona-otp-input [separator]="'*'"></mona-otp-input>`);
    });

    it("formats numbers unquoted and skips values equal to the item default", () => {
        const items = [makeItem({ name: "length", configType: "number", value: 6, defaultValue: 6 })];
        expect(generateComponentCodeSample("mona-otp-input", items, {})).toBe(
            "<mona-otp-input></mona-otp-input>"
        );
        expect(generateComponentCodeSample("mona-otp-input", items, { length: 10 })).toBe(
            `<mona-otp-input [length]="10"></mona-otp-input>`
        );
    });

    it("uses the item alias for the rendered attribute name", () => {
        const items = [makeItem({ name: "roundedValue", alias: "rounded", configType: "string", value: "medium" })];
        const code = generateComponentCodeSample("mona-text-box", items, { roundedValue: "large" });
        expect(code).toBe(`<mona-text-box [rounded]="'large'"></mona-text-box>`);
    });

    it("skips disabled items and non-bindable config types", () => {
        const items = [
            makeItem({ name: "onClick", configType: "function", value: () => {} }),
            makeItem({ name: "click", configType: "event" }),
            makeItem({ name: "note", configType: "string", value: "hi", disabled: true })
        ];
        const code = generateComponentCodeSample("mona-button", items, {});
        expect(code).toBe("<mona-button></mona-button>");
    });

    it("unquotes a raw ts-morph selector literal", () => {
        const code = generateComponentCodeSample(`"mona-otp-input"`, [], {});
        expect(code).toBe("<mona-otp-input></mona-otp-input>");
    });

    it("renders attribute-selector directives as a host attribute on their tag", () => {
        const items = [
            makeItem({ name: "rounded", configType: "dropdown", value: ["none", "medium"], defaultValue: "medium" })
        ];
        const code = generateComponentCodeSample("textarea[monaTextArea]", items, { rounded: "medium" });
        expect(code).toBe(`<textarea monaTextArea></textarea>`);

        const codeWithOverride = generateComponentCodeSample("textarea[monaTextArea]", items, { rounded: "large" });
        expect(codeWithOverride).toBe(`<textarea monaTextArea [rounded]="'large'"></textarea>`);
    });

    it("falls back to a div host for a bare attribute-only selector", () => {
        const code = generateComponentCodeSample("[monaButton]", [], {});
        expect(code).toBe(`<div monaButton></div>`);
    });

    it("wraps attributes onto multiple indented lines when the single-line form is too long", () => {
        const items = [
            makeItem({ name: "aVeryLongPropertyNameOne", configType: "string", value: "" }),
            makeItem({ name: "aVeryLongPropertyNameTwo", configType: "string", value: "" }),
            makeItem({ name: "aVeryLongPropertyNameThree", configType: "string", value: "" })
        ];
        const code = generateComponentCodeSample("mona-some-really-long-component-selector", items, {
            aVeryLongPropertyNameOne: "value-one",
            aVeryLongPropertyNameTwo: "value-two",
            aVeryLongPropertyNameThree: "value-three"
        });
        expect(code).toBe(
            [
                "<mona-some-really-long-component-selector",
                `    [aVeryLongPropertyNameOne]="'value-one'"`,
                `    [aVeryLongPropertyNameTwo]="'value-two'"`,
                `    [aVeryLongPropertyNameThree]="'value-three'">`,
                "</mona-some-really-long-component-selector>"
            ].join("\n")
        );
    });
});

describe("generateFeatureCodeSample", () => {
    it("renders an inactive boolean feature as an empty element", () => {
        const item: ComponentConfigFeatureItemOptions = {
            active: false,
            description: "Enable filtering.",
            name: "Filterable"
        };
        expect(generateFeatureCodeSample("mona-dropdown-list", "filterable", item)).toBe(
            "<mona-dropdown-list></mona-dropdown-list>"
        );
    });

    it("renders an active boolean feature as a true binding", () => {
        const item: ComponentConfigFeatureItemOptions = {
            active: true,
            description: "Enable filtering.",
            name: "Filterable"
        };
        expect(generateFeatureCodeSample("mona-dropdown-list", "filterable", item)).toBe(
            `<mona-dropdown-list [filterable]="true"></mona-dropdown-list>`
        );
    });

    it("renders a dropdown-type feature's current value", () => {
        const item: ComponentConfigFeatureItemOptions = {
            active: true,
            description: "Sets the size.",
            name: "Size",
            type: "dropdown",
            dropdownValue: "large",
            dropdownDefaultValue: "medium"
        };
        expect(generateFeatureCodeSample("mona-chip", "size", item)).toBe(
            `<mona-chip [size]="'large'"></mona-chip>`
        );
    });
});

describe("generateDirectiveBindingCodeSample", () => {
    it("wraps the host attribute binding in the demoed component's own element tag", () => {
        const allFeatures = {} as ComponentConfigFeatureItem;
        const code = generateDirectiveBindingCodeSample(
            "mona-auto-complete",
            { hostAttribute: "monaDropDownFilterable", buildValue: () => ({ enabled: true, operator: "startsWith" }) },
            allFeatures
        );
        expect(code).toBe(
            [
                "<mona-auto-complete",
                `    [monaDropDownFilterable]="{"enabled":true,"operator":"startsWith"}">`,
                "</mona-auto-complete>"
            ].join("\n")
        );
    });

    it("drops undefined members from the built value", () => {
        const allFeatures = {} as ComponentConfigFeatureItem;
        const code = generateDirectiveBindingCodeSample(
            "mona-dropdown-list",
            { hostAttribute: "monaDropDownGroupable", buildValue: () => ({ enabled: false, orderBy: undefined }) },
            allFeatures
        );
        expect(code).toBe(
            ["<mona-dropdown-list", `    [monaDropDownGroupable]="{"enabled":false}">`, "</mona-dropdown-list>"].join(
                "\n"
            )
        );
    });

    it("unquotes a raw ts-morph selector literal", () => {
        const allFeatures = {} as ComponentConfigFeatureItem;
        const code = generateDirectiveBindingCodeSample(
            `"mona-combo-box"`,
            { hostAttribute: "monaDropDownVirtualScroll", buildValue: () => ({ enabled: true }) },
            allFeatures
        );
        expect(code).toBe(`<mona-combo-box [monaDropDownVirtualScroll]="{"enabled":true}"></mona-combo-box>`);
    });
});
