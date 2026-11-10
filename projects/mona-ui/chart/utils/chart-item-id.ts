import { formatItemId } from "../internal/animation/animation-identity";

/** A value that can identify a chart item: a `keyField` value or a category. */
export type ChartItemKey = boolean | Date | number | string;

/**
 * The ID of the item whose category is `category`, as a radial bar or rose series gives an item without a `keyField`
 * value. Use it in `hiddenItemIds`. Returns `undefined` for a number that isn't finite or a date that isn't valid,
 * which can't identify an item.
 */
export function chartItemCategoryId(category: boolean | string): string;
export function chartItemCategoryId(category: ChartItemKey): string | undefined;
export function chartItemCategoryId(category: ChartItemKey): string | undefined {
    return formatItemId("c", category) ?? undefined;
}

/**
 * The ID of the item in row `index`, as a funnel stage, waterfall step, or radial bar or rose item gets it when it has
 * no `keyField` value (and, for a radial series, no category). It follows the position, not the row.
 */
export function chartItemIndexId(index: number): string {
    return `i:${index}`;
}

/**
 * The ID of the item whose `keyField` value is `key`, as funnel stages, treemap nodes, waterfall steps and radial bar
 * and rose items use it. Use it in `hiddenStageIds`, `hiddenNodeIds` or `hiddenItemIds`, or to compare with an ID an
 * event gives. Returns `undefined` for a number that isn't finite or a date that isn't valid, which can't be a key.
 */
export function chartItemKeyId(key: boolean | string): string;
export function chartItemKeyId(key: ChartItemKey): string | undefined;
export function chartItemKeyId(key: ChartItemKey): string | undefined {
    return formatItemId("k", key) ?? undefined;
}
