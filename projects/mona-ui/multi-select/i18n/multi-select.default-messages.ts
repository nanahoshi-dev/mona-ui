import { MonaMultiSelectMessages } from "@nanahoshi/mona-ui/i18n";

export const MULTI_SELECT_DEFAULT_MESSAGES: MonaMultiSelectMessages = {
    clear: "Clear",
    itemsCount: (count: number) => `+ ${count} ${count === 1 ? "item" : "items"}`
};

