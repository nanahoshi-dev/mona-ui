// Generated from i18n/catalogs/en-US.messages.json by scripts/generate-locale-catalogs.ts. Do not edit.
// Edit the JSON file and run `npm run generate:locale-catalogs`.

import { formatNumber, type MonaPagerMessages } from "@nanahoshi/mona-ui/i18n";

function localizeNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return formatNumber(value, "en-US", options);
}

const PLURAL_RULES = new Intl.PluralRules("en-US");

function plural(
    category: Intl.LDMLPluralRule,
    forms: Partial<Record<Intl.LDMLPluralRule, () => string>> & { readonly other: () => string }
): string {
    return (forms[category] ?? forms.other)();
}

export const PAGER_DEFAULT_MESSAGES = {
    firstPageLabel: "First page",
    itemsPerPageLabel: "Items per page",
    jumpBackwardLabel: (pages: number) =>
        `Jump back ${plural(PLURAL_RULES.select(pages), { one: () => `${localizeNumber(pages)} page`, other: () => `${localizeNumber(pages)} pages` })}`,
    jumpForwardLabel: (pages: number) =>
        `Jump forward ${plural(PLURAL_RULES.select(pages), { one: () => `${localizeNumber(pages)} page`, other: () => `${localizeNumber(pages)} pages` })}`,
    lastPageLabel: "Last page",
    nextPageLabel: "Next page",
    ofText: "of",
    pageInputPrefix: (_totalPages: number) => "Page",
    pageInputSuffix: (totalPages: number) => `of ${localizeNumber(totalPages)}`,
    pageLabel: (page: number) => `Page ${localizeNumber(page)}`,
    pageSelectLabel: "Page",
    pageSizeLabel: (pageSize: number) => `${localizeNumber(pageSize)} / page`,
    pageStatus: (page: number, totalPages: number) => `Page ${localizeNumber(page)} of ${localizeNumber(totalPages)}`,
    pageText: "Page",
    pagerLabel: "Pagination",
    previousPageLabel: "Previous page",
    rangeStatus: (start: number, end: number, total: number) =>
        `${localizeNumber(start)} - ${localizeNumber(end)} of ${plural(PLURAL_RULES.select(total), { one: () => `${localizeNumber(total)} item`, other: () => `${localizeNumber(total)} items` })}`
} satisfies MonaPagerMessages;
