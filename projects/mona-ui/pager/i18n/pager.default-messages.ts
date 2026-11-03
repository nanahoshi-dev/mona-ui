import { formatNumber, type MonaPagerMessages } from "@nanahoshi/mona-ui/i18n";

function localizeNumber(value: number): string {
    return formatNumber(value, "en-US");
}

export const PAGER_DEFAULT_MESSAGES = {
    firstPageLabel: "First page",
    jumpBackwardLabel: (pages: number) => `Jump back ${localizeNumber(pages)} pages`,
    jumpForwardLabel: (pages: number) => `Jump forward ${localizeNumber(pages)} pages`,
    lastPageLabel: "Last page",
    nextPageLabel: "Next page",
    ofText: "of",
    pageLabel: (page: number) => `Page ${localizeNumber(page)}`,
    pageSizeLabel: (pageSize: number) => `${localizeNumber(pageSize)} / page`,
    pageStatus: (page: number, totalPages: number) => `Page ${localizeNumber(page)} of ${localizeNumber(totalPages)}`,
    pageText: "Page",
    previousPageLabel: "Previous page",
    rangeStatus: (start: number, end: number, total: number) =>
        `${localizeNumber(start)} - ${localizeNumber(end)} of ${localizeNumber(total)} items`
} satisfies MonaPagerMessages;
