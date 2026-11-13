import type { Router } from "@angular/router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { routeInternalLink } from "./internal-links";

describe("routeInternalLink", () => {
    const host = document.createElement("div");
    const router = { navigateByUrl: vi.fn(() => Promise.resolve(true)) };

    /** Clicks inside a link and reports whether the router took it. The test never lets the browser navigate. */
    function click(href: string, init: MouseEventInit = {}, attributes: Record<string, string> = {}): boolean {
        host.innerHTML = "";
        const link = document.createElement("a");
        link.setAttribute("href", href);
        Object.entries(attributes).forEach(([name, value]) => link.setAttribute(name, value));
        const code = document.createElement("code");
        link.append(code);
        host.append(link);
        document.body.append(host);
        let routed = false;
        const listener = (event: Event): void => {
            routed = routeInternalLink(event as MouseEvent, router as unknown as Router);
            event.preventDefault();
        };
        host.addEventListener("click", listener);
        code.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0, cancelable: true, ...init }));
        host.removeEventListener("click", listener);
        return routed;
    }

    afterEach(() => {
        host.remove();
        router.navigateByUrl.mockClear();
    });

    it("follows a link to another page of the site with the router", () => {
        expect(click("/api/chart/ChartComponent")).toBe(true);
        expect(router.navigateByUrl).toHaveBeenCalledWith("/api/chart/ChartComponent");
    });

    it("leaves a link within the current page, an external link and a modified click to the browser", () => {
        const here = document.defaultView?.location.pathname ?? "/";

        expect(
            [
                click(`${here}#section`),
                click("https://example.com/api"),
                click("//example.com/api"),
                click("/api", { ctrlKey: true }),
                click("/api", {}, { target: "_blank" })
            ].some(Boolean)
        ).toBe(false);
        expect(router.navigateByUrl).not.toHaveBeenCalled();
    });
});
