import { MonaScrollViewMessages } from "@nanahoshi/mona-ui/i18n";

export const SCROLL_VIEW_DEFAULT_MESSAGES: MonaScrollViewMessages = {
    nextPage: "Next page",
    page: (current: number) => `Page ${current}`,
    pageOf: (current: number, total: number) => `Page ${current} of ${total}`,
    previousPage: "Previous page",
    scrollPagerLeft: "Scroll pager left",
    scrollPagerRight: "Scroll pager right",
    slide: "slide"
};
