import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    DocsSearchService,
    PAGEFIND_LOADER,
    type PagefindEngine,
    type PagefindResultData
} from "../../services/docs-search.service";
import { SidebarService } from "../../services/sidebar.service";
import { DocsSearchComponent } from "./docs-search.component";

const COMMAND_PAGE: PagefindResultData = {
    excerpt: "A searchable <mark>list</mark>.",
    meta: { category: "Navigation", title: "Command Menu" },
    // eslint-disable-next-line @typescript-eslint/naming-convention -- Pagefind's name for it.
    sub_results: [
        { excerpt: "Page itself", title: "Command Menu", url: "/components/command/" },
        { excerpt: "Keys and <mark>list</mark>.", title: "Behavior", url: "/components/command/#behavior" }
    ],
    url: "/components/command/"
};

describe("DocsSearchComponent", () => {
    let fixture: ComponentFixture<DocsSearchComponent>;
    let engine: { search: ReturnType<typeof vi.fn<PagefindEngine["search"]>> };
    let loader: ReturnType<typeof vi.fn<() => Promise<PagefindEngine>>>;

    const dialog = (): HTMLElement | null => document.querySelector("[role='dialog']");
    const items = (): HTMLElement[] => Array.from(dialog()?.querySelectorAll("mona-command-item") ?? []);
    const field = (): HTMLInputElement => dialog()?.querySelector("input") as HTMLInputElement;

    async function settle(): Promise<void> {
        await fixture.whenStable();
        await new Promise(resolve => setTimeout(resolve, 150));
        await fixture.whenStable();
    }

    async function open(): Promise<void> {
        TestBed.inject(DocsSearchService).open.set(true);
        await settle();
    }

    async function type(text: string): Promise<void> {
        field().value = text;
        field().dispatchEvent(new Event("input"));
        await settle();
    }

    beforeEach(async () => {
        engine = {
            search: vi.fn<PagefindEngine["search"]>().mockResolvedValue({
                results: [{ data: () => Promise.resolve(COMMAND_PAGE) }]
            })
        };
        loader = vi.fn<() => Promise<PagefindEngine>>().mockImplementation(() => Promise.resolve(engine));
        await TestBed.configureTestingModule({
            imports: [DocsSearchComponent],
            providers: [provideRouter([]), { provide: PAGEFIND_LOADER, useValue: loader }]
        }).compileComponents();
        fixture = TestBed.createComponent(DocsSearchComponent);
        fixture.autoDetectChanges();
    });

    afterEach(async () => {
        TestBed.inject(DocsSearchService).open.set(false);
        await fixture.whenStable();
        document.querySelectorAll(".cdk-overlay-container").forEach(container => (container.innerHTML = ""));
    });

    it("doesn't fetch the engine until someone searches", async () => {
        await open();

        expect(loader).not.toHaveBeenCalled();
        expect(dialog()?.textContent).toContain("Search the guides");
    });

    it("waits for a pause in typing", async () => {
        await open();

        field().value = "l";
        field().dispatchEvent(new Event("input"));
        field().value = "li";
        field().dispatchEvent(new Event("input"));
        await type("list");

        expect(engine.search.mock.calls).toEqual([["list"]]);
    });

    it("shows a page and its sections, without the section that is the page", async () => {
        await open();

        await type("list");

        expect(items().map(item => item.querySelector("span")?.textContent?.replace(/\s+/g, " ").trim())).toEqual([
            "Command Menu Navigation",
            "Behavior"
        ]);
        expect(items()[0].querySelector("mark")?.textContent).toBe("list");
    });

    it("goes to a result, closes, and closes the mobile drawer", async () => {
        const navigate = vi.spyOn(TestBed.inject(Router), "navigateByUrl").mockResolvedValue(true);
        const sidebar = TestBed.inject(SidebarService);
        sidebar.open();
        await open();
        await type("list");

        items()[1].click();
        await fixture.whenStable();

        expect(navigate).toHaveBeenCalledWith("/components/command#behavior");
        expect(TestBed.inject(DocsSearchService).open()).toBe(false);
        expect(sidebar.isOpen()).toBe(false);
    });

    it("opens a new tab with Ctrl and stays open", async () => {
        const windowOpen = vi.spyOn(window, "open").mockReturnValue(null);
        const navigate = vi.spyOn(TestBed.inject(Router), "navigateByUrl").mockResolvedValue(true);
        await open();
        await type("list");

        items()[0].dispatchEvent(new MouseEvent("click", { bubbles: true, ctrlKey: true }));
        await fixture.whenStable();

        expect(windowOpen).toHaveBeenCalledWith("/components/command", "_blank", "noopener");
        expect(navigate).not.toHaveBeenCalled();
        expect(TestBed.inject(DocsSearchService).open()).toBe(true);
        windowOpen.mockRestore();
    });

    it("starts empty the next time it opens", async () => {
        await open();
        await type("list");

        TestBed.inject(DocsSearchService).open.set(false);
        await settle();
        await open();

        expect(field().value).toBe("");
        expect(items()).toEqual([]);
    });

    it("says so when the index can't be loaded, and tries again on the next search", async () => {
        loader.mockImplementationOnce(() => Promise.reject(new Error("No index")));
        await open();

        await type("list");
        expect(dialog()?.textContent).toContain("Search isn't available");
        expect(dialog()?.textContent).not.toContain("No results");

        await type("lists");
        expect(items().length).toBe(2);
    });

    it("says when nothing matches", async () => {
        engine.search.mockResolvedValue({ results: [] });
        await open();

        await type("zzz");

        expect(dialog()?.textContent).toContain("No results found");
    });

    it("passes axe", async () => {
        await open();
        await type("list");

        const results = await axe.run(dialog() as HTMLElement, { rules: { "color-contrast": { enabled: false } } });

        expect(results.violations).toEqual([]);
    });
});
