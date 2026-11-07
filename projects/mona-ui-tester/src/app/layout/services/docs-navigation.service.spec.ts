import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { Router, provideRouter } from "@angular/router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { flattenDocsPages } from "../docs-manifest";
import { DocsNavigationService } from "./docs-navigation.service";

@Component({ template: "" })
class EmptyComponent {}

describe("DocsNavigationService", () => {
    const window = document.defaultView as Window;
    const original = Object.getOwnPropertyDescriptor(window, "localStorage");
    let stored: Map<string, string>;

    function setUp(): { router: Router; service: DocsNavigationService } {
        TestBed.configureTestingModule({
            providers: [provideRouter([{ path: "components/:page", component: EmptyComponent }])]
        });
        return { router: TestBed.inject(Router), service: TestBed.inject(DocsNavigationService) };
    }

    async function go(router: Router, url: string): Promise<void> {
        await router.navigateByUrl(url);
        TestBed.tick();
    }

    beforeEach(() => {
        stored = new Map();
        Object.defineProperty(window, "localStorage", {
            configurable: true,
            value: {
                getItem: (key: string) => stored.get(key) ?? null,
                setItem: (key: string, value: string) => stored.set(key, value)
            }
        });
    });

    afterEach(() => {
        if (original) {
            Object.defineProperty(window, "localStorage", original);
        } else {
            Reflect.deleteProperty(window, "localStorage");
        }
    });

    it("finds the current page and its category, ignoring a fragment", async () => {
        const { router, service } = setUp();

        await go(router, "/components/contextmenu#api");

        expect(service.currentPage()?.title).toBe("Context Menu");
        expect(service.currentCategory()?.id).toBe("navigation");
    });

    it("has no current page on a route the manifest doesn't know", async () => {
        const { router, service } = setUp();

        await go(router, "/components/not-a-page");

        expect(service.currentPage()).toBeNull();
        expect(service.currentCategory()).toBeNull();
        expect(service.nextPage()).toBeNull();
    });

    it("gives neighbors in reading order, across categories, and none at the ends", async () => {
        const { router, service } = setUp();
        const pages = flattenDocsPages();

        await go(router, `/components/${pages[0].path}`);
        expect(service.previousPage()).toBeNull();
        expect(service.nextPage()).toBe(pages[1]);

        await go(router, `/components/${pages[6].path}`);
        expect(service.previousPage()).toBe(pages[5]);

        await go(router, `/components/${pages.at(-1)?.path}`);
        expect(service.nextPage()).toBeNull();
    });

    it("opens the first section and the current page's by default", async () => {
        const { router, service } = setUp();

        await go(router, "/components/grid");

        expect(service.isExpanded("get-started")).toBe(true);
        expect(service.isExpanded("data")).toBe(true);
        expect(service.isExpanded("feedback")).toBe(false);
    });

    it("keeps what the reader chose across sessions", async () => {
        const { router, service } = setUp();
        await go(router, "/components/grid");

        service.toggle("feedback");
        service.toggle("get-started");

        expect(service.isExpanded("feedback")).toBe(true);
        expect(service.isExpanded("get-started")).toBe(false);
        expect(JSON.parse(stored.get("mona-docs-navigation") ?? "")).toEqual({
            feedback: true,
            "get-started": false
        });

        TestBed.resetTestingModule();
        const next = setUp();
        expect(next.service.isExpanded("feedback")).toBe(true);
        expect(next.service.isExpanded("get-started")).toBe(false);
    });

    it("lets the reader close the current section, and reopens it on going to a page in it", async () => {
        const { router, service } = setUp();
        await go(router, "/components/grid");

        service.toggle("data");
        TestBed.tick();
        expect(service.isExpanded("data")).toBe(false);

        await go(router, "/components/pager");
        expect(service.isExpanded("data")).toBe(true);
    });

    it("opens the current page's section on load, even if the reader closed it last time", async () => {
        stored.set("mona-docs-navigation", JSON.stringify({ data: false }));
        const { router, service } = setUp();

        await go(router, "/components/grid");

        expect(service.isExpanded("data")).toBe(true);
    });

    it("ignores stored choices it can't read", () => {
        stored.set("mona-docs-navigation", "not json");

        const { service } = setUp();

        expect(service.isExpanded("feedback")).toBe(false);
    });
});
