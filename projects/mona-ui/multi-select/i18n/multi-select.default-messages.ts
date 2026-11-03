import { formatNumber, MonaMultiSelectMessages } from "@nanahoshi/mona-ui/i18n";

function localizeNumber(value: number): string {
    return formatNumber(value, "en-US");
}

export const MULTI_SELECT_DEFAULT_MESSAGES: MonaMultiSelectMessages = {
    clear: "Clear",
    itemsCount: (count: number) => `+ ${localizeNumber(count)} ${count === 1 ? "item" : "items"}`
};
