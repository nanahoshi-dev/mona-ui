// Generated from i18n/catalogs/en-US.messages.json by scripts/generate-locale-catalogs.ts. Do not edit.
// Edit the JSON file and run `npm run generate:locale-catalogs`.

import { formatNumber, type MonaScrollViewMessages } from "@nanahoshi/mona-ui/i18n";

function localizeNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return formatNumber(value, "en-US", options);
}

export const SCROLL_VIEW_DEFAULT_MESSAGES: MonaScrollViewMessages = {
    carousel: "carousel",
    nextPage: "Next page",
    page: (current: number) => `Page ${localizeNumber(current)}`,
    pageOf: (current: number, total: number) => `Page ${localizeNumber(current)} of ${localizeNumber(total)}`,
    pages: "Pages",
    previousPage: "Previous page",
    scrollPagerNext: "Scroll pager next",
    scrollPagerPrevious: "Scroll pager previous",
    slide: "slide"
};
