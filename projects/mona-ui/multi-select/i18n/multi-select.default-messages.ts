// Generated from i18n/catalogs/en-US.messages.json by scripts/generate-locale-catalogs.ts. Do not edit.
// Edit the JSON file and run `npm run generate:locale-catalogs`.

import { formatNumber, type MonaMultiSelectMessages } from "@nanahoshi/mona-ui/i18n";

function localizeNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return formatNumber(value, "en-US", options);
}

export const MULTI_SELECT_DEFAULT_MESSAGES: MonaMultiSelectMessages = {
    clear: "Clear",
    itemsCount: (count: number) =>
        count === 1 ? `+ ${localizeNumber(count)} item` : `+ ${localizeNumber(count)} items`
};
