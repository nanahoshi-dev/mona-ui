import { ListBoxMoveEvent } from "./ListBoxMoveEvent";
import { ListBoxRemoveEvent } from "./ListBoxRemoveEvent";
import { ListBoxTransferEvent } from "./ListBoxTransferEvent";
import { ListBoxClearEvent } from "./ListBoxClearEvent";

export type ListBoxActionEvent<T = any> =
    | ListBoxClearEvent<T>
    | ListBoxMoveEvent<T>
    | ListBoxRemoveEvent<T>
    | ListBoxTransferEvent<T>;
