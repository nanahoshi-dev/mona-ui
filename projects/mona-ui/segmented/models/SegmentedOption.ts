import type { SegmentedValue } from "./SegmentedValue";

export interface SegmentedOption<T extends SegmentedValue = SegmentedValue> {
    readonly label: string;
    readonly value: T;
    readonly disabled?: boolean;
}
