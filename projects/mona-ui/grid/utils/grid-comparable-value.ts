export type GridComparableValue = boolean | number | bigint | string;

export function toGridComparableValue(value: unknown): GridComparableValue | null {
    if (value instanceof Date) {
        return value.getTime();
    }
    switch (typeof value) {
        case "bigint":
        case "boolean":
        case "number":
        case "string":
            return value;
        default:
            return null;
    }
}

/** Nullish and unsupported values sort first ascending, with stable ties. */
export function compareGridComparableValues(
    left: GridComparableValue | null,
    right: GridComparableValue | null
): number {
    if (left == null) {
        return right == null ? 0 : -1;
    }
    if (right == null) {
        return 1;
    }
    return left < right ? -1 : left > right ? 1 : 0;
}
