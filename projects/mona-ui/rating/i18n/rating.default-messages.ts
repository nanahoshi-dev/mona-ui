import type { MonaRatingMessages } from "@nanahoshi/mona-ui/i18n";

export const RATING_DEFAULT_MESSAGES: MonaRatingMessages = {
    notRated: "Not rated",
    valueText: (value: number, max: number) => `${value} out of ${max}`
};
