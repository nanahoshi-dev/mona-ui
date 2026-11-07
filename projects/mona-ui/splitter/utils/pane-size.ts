import { isDevMode } from "@angular/core";

const warned = new Set<string>();

/**
 * Reads a pane's `min` or `max` as pixels. Drags work in pixels, so a unit that needs a layout to resolve, such as a
 * percentage, can't be honored. It used to be read as that many pixels, which is worse than ignoring it.
 */
export function parsePaneSizeLimit(value: string | number | null | undefined): number | null {
    if (value === null || value === undefined || value === "") {
        return null;
    }
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : null;
    }
    const match = /^\s*(-?\d*\.?\d+)\s*(?:px)?\s*$/i.exec(value);
    if (match) {
        return Number(match[1]);
    }
    if (isDevMode() && !warned.has(value)) {
        warned.add(value);
        console.warn(`mona-splitter-pane: the limit "${value}" is ignored. Use a number or pixels.`);
    }
    return null;
}
