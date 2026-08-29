import { FilterableOptions, VirtualScrollOptions } from "@nanahoshi/mona-ui/common";
import { DropdownFieldSelectorType } from "@nanahoshi/mona-ui/dropdowns";
import { GroupableOptions } from "@nanahoshi/mona-ui/internal/list";
import { ComponentConfigFeatureItem, ComponentConfigFeatureItemOptions } from "./componentConfig";

/**
 * Builds the `FilterableOptions` object a `monaDropDownFilterable`-bound directive expects, from
 * the live "Filtering" feature state. Shared by every dropdown-family demo wrapper component so
 * they don't each duplicate this mapping, and by the Features-tab code sample generator.
 */
export function buildFilterableOptions(featureData: ComponentConfigFeatureItem): FilterableOptions {
    const subFeatures = featureData["filtering"]?.subFeatures ?? {};
    return {
        caseSensitive: subFeatures["caseSensitive"]?.active ?? false,
        debounce: subFeatures["debounce"]?.numericValue ?? 0,
        enabled: featureData["filtering"]?.active ?? false,
        operator: subFeatures["operator"]?.dropdownValue
    };
}

/**
 * Builds the `GroupableOptions` object a `monaDropDownGroupable`-bound directive expects, from the
 * live "Grouping" feature state. See {@link buildFilterableOptions}.
 */
export function buildGroupableOptions(featureData: ComponentConfigFeatureItem): GroupableOptions {
    const subFeatures = featureData["grouping"]?.subFeatures ?? {};
    return {
        enabled: featureData["grouping"]?.active ?? false,
        headerOrder: subFeatures["headerOrder"]?.dropdownValue,
        orderBy: subFeatures["orderBy"]?.dropdownValue,
        orderByDirection: subFeatures["orderByDirection"]?.dropdownValue
    };
}

/**
 * Builds the `VirtualScrollOptions` object a `monaDropDownVirtualScroll`-bound directive expects,
 * from the live "Virtualization" feature state. See {@link buildFilterableOptions}.
 */
export function buildVirtualScrollOptions(featureData: ComponentConfigFeatureItem): Partial<VirtualScrollOptions> {
    const subFeatures = featureData["virtualization"]?.subFeatures ?? {};
    return {
        enabled: featureData["virtualization"]?.active ?? false,
        height: subFeatures["itemHeight"]?.numericValue
    };
}

export const dropdownFilteringFeatureConfig = <TDropdown = any>(
    type: string
): ComponentConfigFeatureItemOptions<TDropdown> => {
    return {
        code: ``,
        active: false,
        description: `Enable filtering of items in the ${type} list.`,
        directiveBinding: {
            hostAttribute: "monaDropDownFilterable",
            buildValue: buildFilterableOptions
        },
        name: "Filtering",
        subFeatures: {
            caseSensitive: {
                code: ``,
                active: false,
                description: `Enable case sensitive filtering.`,
                name: "Case Sensitive",
                type: "boolean"
            },
            debounce: {
                code: ``,
                active: false,
                description: `Debounce time in milliseconds for filtering.`,
                name: "Debounce",
                type: "number"
            },
            operator: {
                code: ``,
                active: false,
                description: `Filtering operator to use.`,
                name: "Operator",
                type: "dropdown",
                dropdownDataSource: ["contains", "startsWith", "endsWith"],
                dropdownValue: "startsWith"
            }
        }
    };
};

export const dropdownDataSetFeatureConfig = (type: string): ComponentConfigFeatureItemOptions<string> => {
    return {
        code: ``,
        hasCode: false,
        active: false,
        description: `Sets a predefined data set for the ${type} list.`,
        name: "Data Set",
        type: "dropdown",
        dropdownDataSource: ["Foods", "Empty"],
        dropdownValue: "Foods"
    };
};

export const dropdownGroupingFeatureConfig = <TDropdown = any>(
    type: string
): ComponentConfigFeatureItemOptions<TDropdown> => {
    return {
        code: ``,
        active: false,
        description: `Enable grouping of items in the ${type} list.`,
        directiveBinding: {
            hostAttribute: "monaDropDownGroupable",
            buildValue: buildGroupableOptions
        },
        name: "Grouping",
        subFeatures: {
            groupBy: {
                code: ``,
                active: false,
                description: `Field to group the items by.`,
                name: "Group By",
                type: "dropdown",
                dropdownDataSource: ["category", "origin"],
                dropdownValue: "category"
            },
            headerOrder: {
                code: ``,
                active: false,
                description: `Order of the group headers.`,
                name: "Header Order",
                type: "dropdown",
                dropdownDataSource: ["asc", "desc", undefined],
                dropdownValue: "asc"
            },
            orderBy: {
                code: ``,
                active: false,
                description: `Field to order the items by within each group.`,
                name: "Order By",
                type: "dropdown",
                dropdownDataSource: ["text", "value", "price"],
                dropdownValue: "text"
            },
            orderByDirection: {
                code: ``,
                active: false,
                description: `Direction to order the items by within each group.`,
                name: "Order By Direction",
                type: "dropdown",
                dropdownDataSource: ["asc", "desc"],
                dropdownValue: "asc"
            },
            groupHeaderTemplate: {
                code: ``,
                active: false,
                description: `This template is used to customize the group header template of the ${type} list.`,
                name: "Group Header Template"
            }
        }
    };
};

export const dropdownPrefixTemplateFeatureConfig = <TDropdown = any>(
    type: string
): ComponentConfigFeatureItemOptions<TDropdown> => {
    return {
        code: ``,
        active: false,
        description: `Enable prefix template for the ${type} list.`,
        name: "Prefix Template"
    };
};

export const dropdownPreventPopupEventFeatureConfig = <TDropdown = any>(
    eventType: string
): ComponentConfigFeatureItemOptions<TDropdown> => {
    return {
        code: ``,
        active: false,
        description: `The "${eventType}" event is fired when the popup is about to ${eventType}`,
        name: `Prevent ${eventType.charAt(0).toUpperCase() + eventType.slice(1)}`
    };
};

export const dropdownSuffixTemplateFeatureConfig = <TDropdown = any>(
    type: string
): ComponentConfigFeatureItemOptions<TDropdown> => {
    return {
        code: ``,
        active: false,
        description: `Enable suffix template for the ${type} list.`,
        name: "Suffix Template"
    };
};

export const dropdownFooterTemplateFeatureConfig = <TDropdown = any>(
    type: string
): ComponentConfigFeatureItemOptions<TDropdown> => {
    return {
        code: ``,
        active: false,
        description: `Enable footer template for the ${type} list.`,
        name: "Footer Template"
    };
};

export const dropdownNoDataTemplateFeatureConfig = <TDropdown = any>(
    type: string
): ComponentConfigFeatureItemOptions<TDropdown> => {
    return {
        code: ``,
        active: false,
        description: `Enable no data template for the ${type} list.`,
        name: "No Data Template"
    };
};

export const dropdownHeaderTemplateFeatureConfig = <TDropdown = any>(
    type: string
): ComponentConfigFeatureItemOptions<TDropdown> => {
    return {
        code: ``,
        active: false,
        description: `Enable header template for the ${type} list.`,
        name: "Header Template"
    };
};

export const dropdownItemTemplateFeatureConfig = <TDropdown = any>(
    type: string
): ComponentConfigFeatureItemOptions<TDropdown> => {
    return {
        code: ``,
        active: false,
        description: `Enable item template for the ${type} list.`,
        name: "Item Template"
    };
};

export const dropdownVirtualizationFeatureConfig = <TDropdown = any>(
    type: string
): ComponentConfigFeatureItemOptions<TDropdown> => {
    return {
        code: ``,
        active: false,
        description: `Enable virtualization for the ${type} list to improve performance with large datasets.`,
        directiveBinding: {
            hostAttribute: "monaDropDownVirtualScroll",
            buildValue: buildVirtualScrollOptions
        },
        name: "Virtualization",
        subFeatures: {
            itemHeight: {
                code: ``,
                active: false,
                description: `Height of each item in pixels.`,
                name: "Item Height",
                type: "number",
                numericValue: 28
            }
        }
    };
};

export const getFormValueText = (formValue: any, field: DropdownFieldSelectorType<unknown>) => {
    if (typeof field === "string") {
        return formValue ? (formValue as any)[field as string] : "";
    } else if (typeof field === "function") {
        return field(formValue);
    }
    return formValue ?? "";
};
