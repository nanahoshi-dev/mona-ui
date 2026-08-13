import type { SegmentedOption } from "./SegmentedOption";
import type { SegmentedValue } from "./SegmentedValue";

/**
 * @description Rendering context passed to the segmented item template.
 */
export interface SegmentedItemTemplateContext<T extends SegmentedValue = SegmentedValue> {
    /**
     * The option rendered by this item.
     */
    readonly $implicit: SegmentedOption<T>;

    /**
     * The option rendered by this item.
     */
    readonly option: SegmentedOption<T>;

    /**
     * Zero-based option index.
     */
    readonly index: number;

    /**
     * Whether this option is currently selected.
     */
    readonly selected: boolean;

    /**
     * Whether this option is disabled, either individually or via the group.
     */
    readonly disabled: boolean;
}
