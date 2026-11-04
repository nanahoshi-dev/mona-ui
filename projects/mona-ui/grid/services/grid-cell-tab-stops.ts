/** Elements that can take focus inside a grid cell. */
export const GRID_CELL_FOCUSABLE_SELECTOR = "button, input, select, textarea, a[href], [tabindex]";

const LOGICAL_CELL_SELECTOR = "[monaGridLogicalCell], [monagridlogicalcell]";

/**
 * Keeps controls inside grid cells out of the page Tab order: each cell is one Tab stop and its contents are
 * reached with the grid's keys. Takes them out once, then only looks at the nodes that change, so a large
 * grid does no work on renders that don't touch its cells. Returns a function that stops observing.
 */
export function observeGridCellTabStops(root: HTMLElement): () => void {
    removeTabStops(root);
    if (typeof MutationObserver === "undefined") {
        return () => undefined;
    }
    const observer = new MutationObserver(records => {
        for (const record of records) {
            if (record.type === "attributes") {
                removeTabStop(record.target);
                continue;
            }
            for (const node of record.addedNodes) {
                if (node instanceof Element) {
                    removeTabStop(node);
                    removeTabStops(node);
                }
            }
        }
    });
    observer.observe(root, { attributeFilter: ["tabindex", "href"], attributes: true, childList: true, subtree: true });
    return () => observer.disconnect();
}

function removeTabStops(container: Element): void {
    for (const element of container.querySelectorAll(GRID_CELL_FOCUSABLE_SELECTOR)) {
        removeTabStop(element);
    }
}

function removeTabStop(node: Node): void {
    if (!(node instanceof Element) || !node.matches(GRID_CELL_FOCUSABLE_SELECTOR)) {
        return;
    }
    if (node.matches(LOGICAL_CELL_SELECTOR) || node.getAttribute("tabindex") === "-1") {
        return;
    }
    // Only controls inside a cell; the cell itself, the toolbar, the pager and the body keep their stops.
    if (node.parentElement?.closest(LOGICAL_CELL_SELECTOR) != null) {
        node.setAttribute("tabindex", "-1");
    }
}
