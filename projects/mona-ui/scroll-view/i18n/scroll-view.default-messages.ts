import { MonaScrollViewMessages } from "@nanahoshi/mona-ui/i18n";

export const SCROLL_VIEW_DEFAULT_MESSAGES: MonaScrollViewMessages = {
    carousel: "carousel",
    nextPage: "Next page",
    page: (current: number) => `Page ${current}`,
    pageOf: (current: number, total: number) => `Page ${current} of ${total}`,
    previousPage: "Previous page",
    scrollPagerPrevious: "Scroll pager previous",
    scrollPagerNext: "Scroll pager next",
    slide: "slide"
};
