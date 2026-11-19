// Generated from i18n/catalogs/en-US.messages.json by scripts/generate-locale-catalogs.ts. Do not edit.
// Edit the JSON file and run `npm run generate:locale-catalogs`.

import { formatNumber, type MonaKanbanMessages } from "@nanahoshi/mona-ui/i18n";

function localizeNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return formatNumber(value, "en-US", options);
}

export const KANBAN_DEFAULT_MESSAGES: MonaKanbanMessages = {
    cardCount: (count: number) => (count === 1 ? `${localizeNumber(count)} card` : `${localizeNumber(count)} cards`),
    cardCountWithLimit: (count: number, limit: number) =>
        `${localizeNumber(count)} of ${limit === 1 ? `${localizeNumber(limit)} card` : `${localizeNumber(limit)} cards`}`,
    emptyColumn: "No cards"
};
