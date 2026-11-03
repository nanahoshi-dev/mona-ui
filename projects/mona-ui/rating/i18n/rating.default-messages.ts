// Generated from i18n/catalogs/en-US.messages.json by scripts/generate-locale-catalogs.ts. Do not edit.
// Edit the JSON file and run `npm run generate:locale-catalogs`.

import { formatNumber, type MonaRatingMessages } from "@nanahoshi/mona-ui/i18n";

function localizeNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return formatNumber(value, "en-US", options);
}

export const RATING_DEFAULT_MESSAGES: MonaRatingMessages = {
    notRated: "Not rated",
    valueText: (value: number, max: number) => `${localizeNumber(value)} out of ${localizeNumber(max)}`
};
