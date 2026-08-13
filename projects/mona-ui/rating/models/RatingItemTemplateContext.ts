/**
 * @description Rendering context passed to the default, selected, and hovered item templates.
 */
export interface RatingItemTemplateContext {
    /**
     * Zero-based item index.
     */
    readonly $implicit: number;

    /**
     * Zero-based item index.
     */
    readonly index: number;

    /**
     * One-based value represented by this item.
     */
    readonly itemValue: number;

    /**
     * Visible fill amount between 0 and 1.
     */
    readonly fill: number;

    /**
     * Whether the visible state comes from the committed value.
     */
    readonly selected: boolean;

    /**
     * Whether the visible state comes from pointer preview.
     */
    readonly hovered: boolean;
}
