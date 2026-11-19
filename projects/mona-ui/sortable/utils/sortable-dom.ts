const FOCUSABLE_SELECTOR = "[tabindex], a[href], button:not([disabled]), input:not([disabled]), select, textarea";

/**
 * A name for an element in an announcement: its `aria-label`, else the text of the elements its `aria-labelledby`
 * names, else, when `useText` is on, its own text, leaving out what's hidden with `aria-hidden`.
 */
export function readElementLabel(element: HTMLElement, useText: boolean): string {
    const label = element.getAttribute("aria-label")?.trim();
    if (label) {
        return label;
    }
    const root = element.getRootNode() as Document | ShadowRoot;
    const labelledBy = (element.getAttribute("aria-labelledby") ?? "")
        .split(/\s+/)
        .filter(id => id.length > 0)
        .map(id => normalizeText(root.getElementById(id)?.textContent))
        .filter(text => text.length > 0)
        .join(" ");
    if (labelledBy) {
        return labelledBy;
    }
    return useText ? readVisibleText(element) : "";
}

/** The element to focus in an item: the item itself when it can take focus, else the first control in it. */
export function findFocusTarget(item: HTMLElement): HTMLElement | null {
    if (item.matches(FOCUSABLE_SELECTOR)) {
        return item;
    }
    return item.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
}

/** Whether a key press is typing in a field, where Control+Shift and an arrow key selects text. */
export function isTextEntryTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) {
        return false;
    }
    if (target.isContentEditable || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
        return true;
    }
    if (!(target instanceof HTMLInputElement)) {
        return false;
    }
    return !["button", "checkbox", "color", "file", "image", "radio", "range", "reset", "submit"].includes(target.type);
}

/**
 * The index of the item above (`step` -1) or below (`step` 1) another in rows that wrap: of the nearest row in that
 * direction, the item whose middle is closest to the other's. The same index when there's no such row.
 */
export function findRowNeighbor(elements: readonly HTMLElement[], from: number, step: -1 | 1): number {
    const rects = elements.map(element => element.getBoundingClientRect());
    const current = rects[from];
    const tolerance = current.height / 2;
    const ahead = rects
        .map((rect, index) => ({ index, rect }))
        .filter(({ rect }) => (step > 0 ? rect.top >= current.bottom - 1 : rect.bottom <= current.top + 1));
    if (ahead.length === 0) {
        return from;
    }
    const rowEdge =
        step > 0 ? Math.min(...ahead.map(({ rect }) => rect.top)) : Math.max(...ahead.map(({ rect }) => rect.bottom));
    const row = ahead.filter(({ rect }) =>
        step > 0 ? rect.top < rowEdge + tolerance : rect.bottom > rowEdge - tolerance
    );
    const middle = current.left + current.width / 2;
    let nearest = row[0];
    for (const candidate of row) {
        const distance = Math.abs(candidate.rect.left + candidate.rect.width / 2 - middle);
        if (distance < Math.abs(nearest.rect.left + nearest.rect.width / 2 - middle)) {
            nearest = candidate;
        }
    }
    return nearest.index;
}

/** An element's text without the parts hidden from assistive technology, such as an icon's or a row number's. */
function readVisibleText(element: HTMLElement): string {
    let text = "";
    const visit = (node: Node): void => {
        for (const child of Array.from(node.childNodes)) {
            if (child.nodeType === Node.TEXT_NODE) {
                text += child.textContent ?? "";
            } else if (child instanceof Element && child.getAttribute("aria-hidden") !== "true") {
                text += " ";
                visit(child);
                text += " ";
            }
        }
    };
    visit(element);
    return normalizeText(text);
}

function normalizeText(text: string | null | undefined): string {
    return (text ?? "").replace(/\s+/g, " ").trim();
}
