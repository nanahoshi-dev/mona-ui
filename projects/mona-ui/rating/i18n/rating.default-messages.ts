import { formatNumber, type MonaRatingMessages } from "@nanahoshi/mona-ui/i18n";

function localizeNumber(value: number): string {
    return formatNumber(value, "en-US");
}

export const RATING_DEFAULT_MESSAGES: MonaRatingMessages = {
    notRated: "Not rated",
    valueText: (value: number, max: number) => `${localizeNumber(value)} out of ${localizeNumber(max)}`
};
