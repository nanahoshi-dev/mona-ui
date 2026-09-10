import type { MonaPagerMessages } from "@nanahoshi/mona-ui/i18n";

export const PAGER_DEFAULT_MESSAGES = {
    firstPageLabel: "First page",
    jumpBackwardLabel: (pages: number) => `Jump back ${pages} pages`,
    jumpForwardLabel: (pages: number) => `Jump forward ${pages} pages`,
    lastPageLabel: "Last page",
    nextPageLabel: "Next page",
    ofText: "of",
    pageLabel: (page: number) => `Page ${page}`,
    pageSizeLabel: (pageSize: number) => `${pageSize} / page`,
    pageStatus: (page: number, totalPages: number) => `Page ${page} of ${totalPages}`,
    pageText: "Page",
    previousPageLabel: "Previous page",
    rangeStatus: (start: number, end: number, total: number) => `${start} - ${end} of ${total} items`
} satisfies MonaPagerMessages;
