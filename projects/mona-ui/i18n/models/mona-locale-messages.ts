import type { MonaCardMessages } from "../message-types/card.messages";
import type { MonaChipMessages } from "../message-types/chip.messages";
import type { MonaPagerMessages } from "../message-types/pager.messages";
import type { MonaSpinnerMessages } from "../message-types/spinner.messages";

export interface MonaLocaleMessages extends Record<string, object> {
    card: MonaCardMessages;
    chip: MonaChipMessages;
    pager: MonaPagerMessages;
    spinner: MonaSpinnerMessages;
}



