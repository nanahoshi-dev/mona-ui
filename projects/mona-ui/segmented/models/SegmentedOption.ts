import type { SegmentedValue } from "./SegmentedValue";

export interface SegmentedOption<T extends SegmentedValue = SegmentedValue> {
    readonly disabled?: boolean;
    readonly label: string;
    readonly value: T;
}
