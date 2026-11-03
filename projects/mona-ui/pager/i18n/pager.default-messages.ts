// Generated from i18n/catalogs/en-US.messages.json by scripts/generate-locale-catalogs.ts. Do not edit.
// Edit the JSON file and run `npm run generate:locale-catalogs`.

import { formatNumber, type MonaPagerMessages } from "@nanahoshi/mona-ui/i18n";

function localizeNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return formatNumber(value, "en-US", options);
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
