import type { MonaPagerMessages } from "../message-types/pager.messages";

export interface MonaLocaleMessages extends Record<string, object> {
    pager: MonaPagerMessages;
}
