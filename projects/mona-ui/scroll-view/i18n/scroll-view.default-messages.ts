import { formatNumber, MonaScrollViewMessages } from "@nanahoshi/mona-ui/i18n";

function localizeNumber(value: number): string {
    return formatNumber(value, "en-US");
}

export const SCROLL_VIEW_DEFAULT_MESSAGES: MonaScrollViewMessages = {
    carousel: "carousel",
    nextPage: "Next page",
    page: (current: number) => `Page ${localizeNumber(current)}`,
    pageOf: (current: number, total: number) => `Page ${localizeNumber(current)} of ${localizeNumber(total)}`,
    previousPage: "Previous page",
    scrollPagerPrevious: "Scroll pager previous",
    scrollPagerNext: "Scroll pager next",
    slide: "slide"
};
