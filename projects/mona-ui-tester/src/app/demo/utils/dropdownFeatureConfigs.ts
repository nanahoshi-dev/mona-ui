import { ComponentConfigFeatureItemOptions } from "./componentConfig";

export const dropdownFilteringFeatureConfig = <TDropdown = any>(
    type: string
): ComponentConfigFeatureItemOptions<TDropdown> => {
    return {
        code: ``,
        active: false,
        description: `Enable filtering of items in the ${type} list.`,
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
                dropdownValue: "contains"
            }
        }
    };
};

export const dropdownGroupingFeatureConfig = <TDropdown = any>(
    type: string
): ComponentConfigFeatureItemOptions<TDropdown> => {
    return {
        code: ``,
        active: false,
        description: `Enable grouping of items in the ${type} list.`,
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

export const dropdownVirtualizationFeatureConfig = <TDropdown = any>(
    type: string
): ComponentConfigFeatureItemOptions<TDropdown> => {
    return {
        code: ``,
        active: false,
        description: `Enable virtualization for the ${type} list to improve performance with large datasets.`,
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
