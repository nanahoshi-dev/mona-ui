// Generated from i18n/catalogs/en-US.messages.json by scripts/generate-locale-catalogs.ts. Do not edit.
// Edit the JSON file and run `npm run generate:locale-catalogs`.

import { formatNumber, type MonaListBoxMessages } from "@nanahoshi/mona-ui/i18n";

function localizeNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return formatNumber(value, "en-US", options);
}

export const LIST_BOX_DEFAULT_MESSAGES: MonaListBoxMessages = {
    clearSelection: "Clear Selection",
    itemsMoved: (position: number, total: number) =>
        `Moved to position ${localizeNumber(position)} of ${localizeNumber(total)}`,
    itemsRemoved: (count: number) =>
        count === 1 ? `${localizeNumber(count)} item removed` : `${localizeNumber(count)} items removed`,
    itemsTransferred: (count: number, list: string) =>
        count === 1
            ? `${localizeNumber(count)} item moved to ${list}`
            : `${localizeNumber(count)} items moved to ${list}`,
    itemsTransferredToOtherList: (count: number) =>
        count === 1
            ? `${localizeNumber(count)} item moved to the other list`
            : `${localizeNumber(count)} items moved to the other list`,
    moveDown: "Move Down",
    moveUp: "Move Up",
    remove: "Remove",
    selectionCleared: "Selection cleared",
    toolbarLabel: (list: string) => `${list} actions`,
    transferAllFrom: "Transfer all from the other list",
    transferAllFromList: (list: string) => `Transfer all from ${list}`,
    transferAllTo: "Transfer all to the other list",
    transferAllToList: (list: string) => `Transfer all to ${list}`,
    transferFrom: "Transfer from the other list",
    transferFromList: (list: string) => `Transfer from ${list}`,
    transferTo: "Transfer to the other list",
    transferToList: (list: string) => `Transfer to ${list}`
};
