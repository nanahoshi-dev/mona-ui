import type { Router } from "@angular/router";

/**
 * Follows a plain click on a link to another page of this site with the router, so rendered markdown and HTML can link
 * like a `routerLink` does instead of reloading the app. A link within the current page is left to the browser, which
 * scrolls to its target, and so is a click with a modifier key, which opens a tab or window.
 */
export function routeInternalLink(event: MouseEvent, router: Router): boolean {
    if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
    ) {
        return false;
    }
    const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
    if (
        !(link instanceof HTMLAnchorElement) ||
        (link.target && link.target !== "_self") ||
        link.hasAttribute("download")
    ) {
        return false;
    }
    const href = link.getAttribute("href") ?? "";
    const location = link.ownerDocument.defaultView?.location;
    if (!href.startsWith("/") || href.startsWith("//") || !location) {
        return false;
    }
    if (new URL(href, location.origin).pathname === location.pathname) {
        return false;
    }
    event.preventDefault();
    void router.navigateByUrl(href);
    return true;
}
