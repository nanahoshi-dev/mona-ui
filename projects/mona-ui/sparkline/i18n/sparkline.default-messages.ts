// Generated from i18n/catalogs/en-US.messages.json by scripts/generate-locale-catalogs.ts. Do not edit.
// Edit the JSON file and run `npm run generate:locale-catalogs`.

import { formatNumber, type MonaSparklineMessages } from "@nanahoshi/mona-ui/i18n";

function localizeNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return formatNumber(value, "en-US", options);
}

export const SPARKLINE_DEFAULT_MESSAGES: MonaSparklineMessages = {
    noData: "No data",
    summary: (count: number, first: string, last: string, min: string, max: string) =>
        `${count === 1 ? `${localizeNumber(count)} value` : `${localizeNumber(count)} values`}, first ${first}, last ${last}, lowest ${min}, highest ${max}`,
    winLossSummary: (wins: number, losses: number, draws: number) =>
        `${wins === 1 ? `${localizeNumber(wins)} win` : `${localizeNumber(wins)} wins`}, ${losses === 1 ? `${localizeNumber(losses)} loss` : `${localizeNumber(losses)} losses`}, ${draws === 1 ? `${localizeNumber(draws)} draw` : `${localizeNumber(draws)} draws`}`
};
