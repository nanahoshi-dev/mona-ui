// Generated from i18n/catalogs/en-US.messages.json by scripts/generate-locale-catalogs.ts. Do not edit.
// Edit the JSON file and run `npm run generate:locale-catalogs`.

import { formatNumber, type MonaTreeViewMessages } from "@nanahoshi/mona-ui/i18n";

function localizeNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return formatNumber(value, "en-US", options);
}

export const TREE_DEFAULT_MESSAGES: MonaTreeViewMessages = {
    collapse: "Collapse",
    expand: "Expand",
    filter: "Filter",
    filterLabel: (tree: string) => `Filter ${tree}`,
    filterTree: "Filter tree",
    loadError: (node: string) => `Couldn't load the items in ${node}`,
    loadingNode: (node: string) => `Loading ${node}`,
    noData: "No data",
    noMatches: "No matching items",
    results: (count: number) => (count === 1 ? `${localizeNumber(count)} result` : `${localizeNumber(count)} results`),
    retryLoading: (node: string) => `Retry loading ${node}`
};
