import type { DropdownFieldPredicateType, DropdownFieldSelectorType } from "../models/DropdownFieldTypes";

/**
 * Reads a dropdown field from an item: a property of it when the field is a name, or what the field returns when it
 * is an accessor. Without a field, the item itself.
 * @hidden Exported for Mona UI's other entry points; applications don't need it.
 */
export function readDropdownField<TData>(
    item: TData,
    field: DropdownFieldPredicateType<TData> | DropdownFieldSelectorType<TData>
): unknown {
    if (!field) {
        return item;
    }
    if (typeof field === "string") {
        return (item as Record<string, unknown> | null)?.[field];
    }
    return field(item);
}
