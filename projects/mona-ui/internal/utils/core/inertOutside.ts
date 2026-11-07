/**
 * How many open modal overlays made each element inert. An element is made inert by the first and released by the
 * last, so closing one of two stacked modals leaves the page behind the other one inert.
 */
const inertCounts = new WeakMap<Element, number>();

/**
 * Elements left alone: they hold no content, announce for everyone (live regions, CDK's live announcer), or hold the
 * popups a modal opens. A modal in the overlay container has that container on its own path, so this only matters for
 * one in the page.
 */
const isExempt = (element: Element): boolean =>
    element instanceof HTMLScriptElement ||
    element instanceof HTMLStyleElement ||
    element instanceof HTMLTemplateElement ||
    element.hasAttribute("aria-live") ||
    element.classList.contains("cdk-overlay-backdrop") ||
    element.classList.contains("cdk-overlay-container");

export interface InertOutsideOptions {
    /** Elements that manage themselves, or have to stay usable beside the modal. */
    readonly keep?: (element: Element) => boolean;
    /** Where the walk up stops, for a modal that only claims part of the page. Defaults to `<body>`. */
    readonly stopAt?: Element | null;
}

/**
 * Makes everything outside a modal overlay inert, so assistive technology, the pointer and Tab can't reach the page
 * behind it. Walking up from `element` to `<body>`, every sibling is made inert, except that inside the CDK overlay
 * container only the overlays opened before this one are: popups opened later (a dropdown inside the dialog) stay
 * usable. Elements that were inert already are left as they are.
 * @param element the overlay's host element (the CDK overlay wrapper)
 * @param options what to leave alone, and where to stop
 * @returns the function that releases what this call made inert
 */
export const inertOutside = (element: Element, options: InertOutsideOptions = {}): (() => void) => {
    const body = element.ownerDocument.body;
    const acquired: Element[] = [];
    let node: Element | null = element;
    while (node && node !== body && node !== options.stopAt && node.parentElement) {
        const parent: Element = node.parentElement;
        const onlyEarlier = parent.classList.contains("cdk-overlay-container");
        for (const sibling of Array.from(parent.children)) {
            if (sibling === node) {
                if (onlyEarlier) {
                    break;
                }
                continue;
            }
            if (isExempt(sibling) || options.keep?.(sibling)) {
                continue;
            }
            const count = inertCounts.get(sibling) ?? 0;
            if (count === 0 && sibling.hasAttribute("inert")) {
                continue;
            }
            inertCounts.set(sibling, count + 1);
            if (count === 0) {
                sibling.setAttribute("inert", "");
            }
            acquired.push(sibling);
        }
        node = parent;
    }
    let released = false;
    return () => {
        if (released) {
            return;
        }
        released = true;
        for (const sibling of acquired) {
            const count = (inertCounts.get(sibling) ?? 1) - 1;
            if (count <= 0) {
                inertCounts.delete(sibling);
                sibling.removeAttribute("inert");
            } else {
                inertCounts.set(sibling, count);
            }
        }
    };
};
