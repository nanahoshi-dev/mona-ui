import { describe, expect, it } from "vitest";
import { ComponentConfigFeatureItem } from "./componentConfig";
import {
    buildFilterableOptions,
    buildGroupableOptions,
    buildVirtualScrollOptions,
    dropdownFilteringFeatureConfig,
    dropdownGroupingFeatureConfig,
    dropdownVirtualizationFeatureConfig
} from "./dropdownFeatureConfigs";

describe("buildFilterableOptions", () => {
    it("defaults to disabled with no debounce when the feature map has no filtering entry", () => {
        expect(buildFilterableOptions({} as ComponentConfigFeatureItem)).toEqual({
            caseSensitive: false,
            debounce: 0,
            enabled: false,
            operator: undefined
        });
    });

    it("reads active state and sub-feature values", () => {
        const featureData = {
            filtering: {
                active: true,
                description: "",
                name: "Filtering",
                subFeatures: {
                    caseSensitive: { active: true, description: "", name: "Case Sensitive" },
                    debounce: { active: false, description: "", name: "Debounce", numericValue: 250 },
                    operator: { active: false, description: "", name: "Operator", dropdownValue: "endsWith" }
                }
            }
        } as unknown as ComponentConfigFeatureItem;

        expect(buildFilterableOptions(featureData)).toEqual({
            caseSensitive: true,
            debounce: 250,
            enabled: true,
            operator: "endsWith"
        });
    });
});

describe("buildGroupableOptions", () => {
    it("reads active state and sub-feature values", () => {
        const featureData = {
            grouping: {
                active: true,
                description: "",
                name: "Grouping",
                subFeatures: {
                    headerOrder: { active: false, description: "", name: "Header Order", dropdownValue: "desc" },
                    orderBy: { active: false, description: "", name: "Order By", dropdownValue: "price" },
                    orderByDirection: { active: false, description: "", name: "Order By Direction", dropdownValue: "asc" }
                }
            }
        } as unknown as ComponentConfigFeatureItem;

        expect(buildGroupableOptions(featureData)).toEqual({
            enabled: true,
            headerOrder: "desc",
            orderBy: "price",
            orderByDirection: "asc"
        });
    });
});

describe("buildVirtualScrollOptions", () => {
    it("reads active state and item height", () => {
        const featureData = {
            virtualization: {
                active: true,
                description: "",
                name: "Virtualization",
                subFeatures: {
                    itemHeight: { active: false, description: "", name: "Item Height", numericValue: 40 }
                }
            }
        } as unknown as ComponentConfigFeatureItem;

        expect(buildVirtualScrollOptions(featureData)).toEqual({
            enabled: true,
            height: 40
        });
    });
});

describe("directiveBinding wiring", () => {
    it("filtering factory binds monaDropDownFilterable to buildFilterableOptions", () => {
        const config = dropdownFilteringFeatureConfig("dropdown");
        expect(config.directiveBinding?.hostAttribute).toBe("monaDropDownFilterable");
        expect(config.directiveBinding?.buildValue).toBe(buildFilterableOptions);
    });

    it("grouping factory binds monaDropDownGroupable to buildGroupableOptions", () => {
        const config = dropdownGroupingFeatureConfig("dropdown");
        expect(config.directiveBinding?.hostAttribute).toBe("monaDropDownGroupable");
        expect(config.directiveBinding?.buildValue).toBe(buildGroupableOptions);
    });

    it("virtualization factory binds monaDropDownVirtualScroll to buildVirtualScrollOptions", () => {
        const config = dropdownVirtualizationFeatureConfig("dropdown");
        expect(config.directiveBinding?.hostAttribute).toBe("monaDropDownVirtualScroll");
        expect(config.directiveBinding?.buildValue).toBe(buildVirtualScrollOptions);
    });
});
