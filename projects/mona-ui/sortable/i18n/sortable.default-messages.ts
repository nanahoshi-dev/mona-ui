// Generated from i18n/catalogs/en-US.messages.json by scripts/generate-locale-catalogs.ts. Do not edit.
// Edit the JSON file and run `npm run generate:locale-catalogs`.

import { formatNumber, type MonaSortableMessages } from "@nanahoshi/mona-ui/i18n";

function localizeNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return formatNumber(value, "en-US", options);
}

export const SORTABLE_DEFAULT_MESSAGES: MonaSortableMessages = {
    itemMoved: (item: string, position: number, total: number) =>
        `${item} moved to position ${localizeNumber(position)} of ${localizeNumber(total)}`,
    itemMovedToList: (item: string, list: string, position: number, total: number) =>
        `${item} moved to ${list}, position ${localizeNumber(position)} of ${localizeNumber(total)}`
};
