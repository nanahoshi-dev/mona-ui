/** The context of a `monaTileViewItemTemplate`: the data item, as `let-item`, and the tile's state. */
export interface TileViewItemTemplateContext<T> {
    /** The data item. */
    readonly $implicit: T;
    /** Whether the tile is the active one, which the keyboard moves from. */
    readonly active: boolean;
    /** The item's position among the items, from 0. */
    readonly index: number;
    /** Whether the item is selected. */
    readonly selected: boolean;
    /**
     * A number no other rendered tile has, which a tile scrolling into view takes over from one that scrolled away.
     * Key work that a newer tile should replace by it, such as a picture request, so that fast scrolling leaves only
     * the tiles in view waiting. It changes when the view's size does.
     */
    readonly slot: number;
}
