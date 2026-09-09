import type { MonaChipMessages } from "../message-types/chip.messages";
import type { MonaPagerMessages } from "../message-types/pager.messages";

export interface MonaLocaleMessages extends Record<string, object> {
    chip: MonaChipMessages;
    pager: MonaPagerMessages;
}

