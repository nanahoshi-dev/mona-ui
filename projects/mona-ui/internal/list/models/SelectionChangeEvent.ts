import { ListItem } from "./ListItem";

export interface SelectionChangeEvent<T> {
    item: ListItem<T>;
    source: SelectionSource;
}

export type SelectionSource = { via: "mouse" } | { via: "keyboard"; key: string };
