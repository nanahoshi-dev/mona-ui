import { ListBoxMoveEvent } from "./ListBoxMoveEvent";
import { ListBoxRemoveEvent } from "./ListBoxRemoveEvent";
import { ListBoxTransferEvent } from "./ListBoxTransferEvent";
import { ListBoxClearEvent } from "./ListBoxClearEvent";

// `any` by default, so an event annotated without a type argument keeps untyped items.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ListBoxActionEvent<T = any> =
    ListBoxClearEvent<T> | ListBoxMoveEvent<T> | ListBoxRemoveEvent<T> | ListBoxTransferEvent<T>;
