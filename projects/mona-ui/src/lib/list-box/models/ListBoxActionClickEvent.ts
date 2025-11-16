import { ListBoxMoveEvent } from "./ListBoxMoveEvent";
import { ListBoxRemoveEvent } from "./ListBoxRemoveEvent";
import { ListBoxTransferEvent } from "./ListBoxTransferEvent";

export type ListBoxActionEvent<T = any> = ListBoxMoveEvent<T> | ListBoxRemoveEvent<T> | ListBoxTransferEvent<T>;
