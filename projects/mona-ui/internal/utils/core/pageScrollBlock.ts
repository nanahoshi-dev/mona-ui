import type { ScrollStrategy } from "@angular/cdk/overlay";

/**
 * Wraps CDK's block strategy so it blocks the page's scroll behind a modal only on a page whose root scrolls.
 *
 * CDK keeps the page's scrollbar while it blocks, by forcing `overflow-y: scroll` on `<html>`. A page that scrolls a
 * container inside instead, such as an app shell that sets `overflow: hidden` on `html` and `body`, has no scrollbar to
 * keep: the forced one appears from nowhere, narrows the page and moves it sideways. The user can't scroll that page's
 * root anyway, so it is left alone.
 *
 * The caller creates `block`, with `createBlockScrollStrategy` or `Overlay.scrollStrategies.block()`, so this bundle
 * doesn't import the overlay module, which every component would then load.
 */
export function createPageScrollBlockStrategy(document: Document, block: ScrollStrategy): ScrollStrategy {
    return {
        attach: overlayRef => block.attach(overlayRef),
        disable: () => block.disable(),
        enable: () => {
            if (rootScrollsVertically(document)) {
                block.enable();
            }
        }
    };
}

/** `<html>` decides whether the page scrolls, or `<body>` when `<html>` leaves its overflow `visible`. */
function rootScrollsVertically(document: Document): boolean {
    const view = document.defaultView;
    if (!view) {
        return false;
    }
    const rootOverflow = view.getComputedStyle(document.documentElement).overflowY;
    const overflow =
        rootOverflow === "visible" && document.body ? view.getComputedStyle(document.body).overflowY : rootOverflow;
    return overflow !== "hidden" && overflow !== "clip";
}
