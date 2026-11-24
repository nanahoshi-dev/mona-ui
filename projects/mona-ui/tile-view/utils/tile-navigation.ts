/** A key that moves through the tiles: by one, by a row, by a page or to an end. */
export type TileNavigationKey =
    "ArrowDown" | "ArrowLeft" | "ArrowRight" | "ArrowUp" | "End" | "Home" | "PageDown" | "PageUp";

/** How the tiles are laid out, which decides where a key moves to. */
export interface TileLayout {
    /** How many tiles a row holds. At least one. */
    readonly columns: number;
    /** How many tiles there are. */
    readonly count: number;
    /** How many whole rows fit in view, which a page moves by. At least one. */
    readonly pageRows: number;
    /** Whether the tiles run from right to left, which swaps the left and right arrows. */
    readonly rtl: boolean;
}

const NAVIGATION_KEYS: ReadonlySet<string> = new Set<TileNavigationKey>([
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "End",
    "Home",
    "PageDown",
    "PageUp"
]);

export function isTileNavigationKey(key: string): key is TileNavigationKey {
    return NAVIGATION_KEYS.has(key);
}

/**
 * The index a key moves to from `from`, or `from` itself at an edge. Left and right move by one, and don't wrap to
 * the next row's other end, as in a file explorer; down from a column the last row doesn't reach moves to the last
 * tile. With no tile yet, any key starts at the first, or at the last for End.
 */
export function navigateTiles(from: number, key: TileNavigationKey, layout: TileLayout): number {
    const { columns, count, pageRows, rtl } = layout;
    if (count === 0) {
        return -1;
    }
    const last = count - 1;
    if (from < 0 || from > last) {
        return key === "End" ? last : 0;
    }
    const column = from % columns;
    switch (key) {
        case "ArrowLeft":
        case "ArrowRight": {
            const forward = (key === "ArrowRight") !== rtl;
            if (forward) {
                return column < columns - 1 ? Math.min(from + 1, last) : from;
            }
            return column > 0 ? from - 1 : from;
        }
        case "ArrowDown":
            return byRows(from, 1, columns, last);
        case "ArrowUp":
            return byRows(from, -1, columns, last);
        case "PageDown":
            return byRows(from, Math.max(1, pageRows), columns, last);
        case "PageUp":
            return byRows(from, -Math.max(1, pageRows), columns, last);
        case "Home":
            return 0;
        case "End":
            return last;
    }
}

/**
 * Moves by whole rows, staying in the column and stopping at the first and last rows. Down into a column the last
 * row doesn't reach lands on the last tile, as there is nothing under it.
 */
function byRows(from: number, rows: number, columns: number, last: number): number {
    const row = Math.floor(from / columns);
    const target = Math.min(Math.max(row + rows, 0), Math.floor(last / columns));
    return target === row ? from : Math.min(target * columns + (from % columns), last);
}

/** How many tiles fit across a width, at least one. */
export function tileColumns(width: number, tileWidth: number, gap: number): number {
    if (width <= 0 || tileWidth <= 0) {
        return 1;
    }
    // Rows have a gap at each side as well as between their tiles.
    return Math.max(1, Math.floor((width - gap) / (tileWidth + gap)));
}
