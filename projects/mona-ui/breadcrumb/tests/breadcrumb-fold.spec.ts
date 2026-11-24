import { Component, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BreadcrumbItemComponent } from "../components/breadcrumb-item/breadcrumb-item.component";
import { BreadcrumbComponent } from "../components/breadcrumb/breadcrumb.component";

/** Stands in for the browser's ResizeObserver, which jsdom lacks, so a test can say when sizes change. */
class FakeResizeObserver {
    readonly #callback: ResizeObserverCallback;
    public static readonly instances = new Set<FakeResizeObserver>();
    public readonly observed = new Set<Element>();

    public constructor(callback: ResizeObserverCallback) {
        this.#callback = callback;
        FakeResizeObserver.instances.add(this);
    }

    public static resize(): void {
        for (const observer of FakeResizeObserver.instances) {
            observer.#callback([], observer as unknown as ResizeObserver);
        }
    }

    public disconnect(): void {
        FakeResizeObserver.instances.delete(this);
        this.observed.clear();
    }

    public observe(target: Element): void {
        this.observed.add(target);
    }

    public unobserve(target: Element): void {
        this.observed.delete(target);
    }
}

const TRAIL: readonly string[] = ["Home", "Documents", "Projects", "Mona", "Explorer", "Current folder"];

@Component({
    template: `
        <div [attr.dir]="dir()">
            <mona-breadcrumb [maxItems]="maxItems()">
                @for (crumb of crumbs(); track crumb) {
                    <mona-breadcrumb-item>{{ crumb }}</mona-breadcrumb-item>
                }
            </mona-breadcrumb>
        </div>
    `,
    imports: [BreadcrumbComponent, BreadcrumbItemComponent]
})
class HostComponent {
    public readonly crumbs = signal<readonly string[]>(TRAIL);
    public readonly dir = signal<"ltr" | "rtl">("ltr");
    public readonly maxItems = signal<number | null>(null);
}

/*
 * jsdom lays nothing out, so the widths come from the text: an item is 10px a character, a separator 20px and the
 * collapse button 30px. The trail above is 40 + 90 + 80 + 40 + 80 + 140 = 470px of items and 5 × 20 = 100px of
 * separators. Folding the first n of its middle items needs, from 570px with nothing folded: 510, 410, 350 and 250px.
 */
const CHARACTER_WIDTH = 10;
const FOLD_BUTTON_WIDTH = 30;
const SEPARATOR_WIDTH = 20;

describe("mona-breadcrumb folding to fit", () => {
    const getComputedStyle = window.getComputedStyle;
    const widened = new Map<string, number>();
    let available = 1000;
    let fixture: ComponentFixture<HostComponent>;
    let gap = 0;
    let host: HostComponent;

    function widthOf(element: Element): number | null {
        if (element.closest("mona-breadcrumb") == null) {
            return null;
        }
        if (element instanceof HTMLOListElement) {
            return available;
        }
        if (element.hasAttribute("data-item-index")) {
            const text = element.textContent?.trim() ?? "";
            return widened.get(text) ?? text.length * CHARACTER_WIDTH;
        }
        if (element.hasAttribute("data-breadcrumb-fold")) {
            return FOLD_BUTTON_WIDTH;
        }
        return element instanceof HTMLLIElement ? SEPARATOR_WIDTH : null;
    }

    async function settle(): Promise<void> {
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    async function setup(options: { maxItems?: number; width?: number } = {}): Promise<void> {
        available = options.width ?? available;
        fixture = TestBed.createComponent(HostComponent);
        host = fixture.componentInstance;
        host.maxItems.set(options.maxItems ?? null);
        await settle();
    }

    async function resizeTo(width: number): Promise<void> {
        available = width;
        FakeResizeObserver.resize();
        await settle();
    }

    function query<T extends Element>(selector: string): T | null {
        return fixture.nativeElement.querySelector(selector);
    }

    function queryAll<T extends Element>(selector: string): T[] {
        return Array.from(fixture.nativeElement.querySelectorAll(selector));
    }

    /** The texts of the shown items, with "" for the collapse button. */
    function visibleTexts(): (string | undefined)[] {
        return queryAll("li:not([aria-hidden]):not([hidden])").map(item => item.textContent?.trim());
    }

    function expandButton(): HTMLButtonElement | null {
        return query("li:not([hidden]) > [data-breadcrumb-expand]");
    }

    function itemButton(text: string): HTMLButtonElement {
        const button = queryAll<HTMLButtonElement>("li[data-item-index] > button").find(
            element => element.textContent?.trim() === text
        );
        if (button == null) {
            throw new Error(`No item button "${text}".`);
        }
        return button;
    }

    beforeEach(() => {
        vi.stubGlobal("ResizeObserver", FakeResizeObserver);
        available = 1000;
        gap = 0;
        widened.clear();
        vi.spyOn(window, "getComputedStyle").mockImplementation((element, pseudoElement) => {
            const style = getComputedStyle.call(window, element, pseudoElement);
            return new Proxy(style, {
                get(target, property) {
                    const width = property === "width" ? widthOf(element) : null;
                    if (width != null) {
                        return `${width}px`;
                    }
                    if (property === "columnGap" && element instanceof HTMLOListElement) {
                        return `${gap}px`;
                    }
                    const value: unknown = Reflect.get(target, property, target);
                    return typeof value === "function" ? value.bind(target) : value;
                }
            });
        });
    });

    afterEach(() => {
        fixture?.destroy();
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    describe("by width", () => {
        it("shows the whole trail, and no button, while it fits", async () => {
            await setup();
            expect(visibleTexts()).toEqual(TRAIL);
            expect(expandButton()).toBeNull();
        });

        it.each([
            [560, ["Home", "", "Projects", "Mona", "Explorer", "Current folder"]],
            [510, ["Home", "", "Projects", "Mona", "Explorer", "Current folder"]],
            [409, ["Home", "", "Explorer", "Current folder"]],
            [350, ["Home", "", "Explorer", "Current folder"]],
            [349, ["Home", "", "Current folder"]]
        ])("folds the items nearest the start first, until the rest fit in %spx", async (width, expected) => {
            await setup();
            await resizeTo(width);
            expect(visibleTexts()).toEqual(expected);
            expect(expandButton()?.getAttribute("aria-label")).toBe("Show full path");
        });

        it("keeps the first item and the current page when even those don't fit", async () => {
            await setup();
            await resizeTo(100);
            expect(visibleTexts()).toEqual(["Home", "", "Current folder"]);
        });

        it("keeps a separator between each two entries it shows, and none after the last", async () => {
            await setup({ width: 400 });
            const separators = queryAll("li[aria-hidden='true']:not([hidden])");
            expect(separators).toHaveLength(visibleTexts().length - 1);
            expect(query("li:last-child")?.textContent?.trim()).toBe("Current folder");
        });

        it("unfolds as it widens", async () => {
            await setup();
            await resizeTo(300);
            await resizeTo(510);
            expect(visibleTexts()).toEqual(["Home", "", "Projects", "Mona", "Explorer", "Current folder"]);
            await resizeTo(570);
            expect(visibleTexts()).toEqual(TRAIL);
            expect(expandButton()).toBeNull();
        });

        it("counts the gap between entries", async () => {
            gap = 5;
            // 570px and ten gaps don't fit in 600px; with the button, 510px and ten gaps do.
            await setup({ width: 600 });
            expect(visibleTexts()).toEqual(["Home", "", "Projects", "Mona", "Explorer", "Current folder"]);
        });

        it("measures again when an item resizes", async () => {
            await setup({ width: 570 });
            expect(expandButton()).toBeNull();
            widened.set("Explorer", 120);
            FakeResizeObserver.resize();
            await settle();
            expect(visibleTexts()).toEqual(["Home", "", "Projects", "Mona", "Explorer", "Current folder"]);
        });

        it("watches the list and every entry for a change in size", async () => {
            await setup();
            const [observer] = FakeResizeObserver.instances;
            expect(observer.observed.has(query("ol")!)).toBe(true);
            for (const entry of queryAll("ol > li")) {
                expect(observer.observed.has(entry)).toBe(true);
            }
        });

        it("folds in the render that shows the trail, before any resize", async () => {
            await setup({ width: 400 });
            expect(visibleTexts()).toEqual(["Home", "", "Explorer", "Current folder"]);

            // One change detection, with no waiting: the render that shows the new trail already folds it.
            host.crumbs.set(["Home", "Music", "Albums", "Live", "Recordings", "Encore"]);
            fixture.detectChanges();
            // 350px of items and 100px of separators; with the button in place of Music, 430px is still too wide.
            expect(visibleTexts()).toEqual(["Home", "", "Live", "Recordings", "Encore"]);
        });

        it("doesn't fold a trail of two", async () => {
            available = 50;
            fixture = TestBed.createComponent(HostComponent);
            fixture.componentInstance.crumbs.set(["Home", "Current folder"]);
            await settle();
            expect(visibleTexts()).toEqual(["Home", "Current folder"]);
            expect(query("[data-breadcrumb-expand]")).toBeNull();
        });

        it("holds in a right-to-left layout", async () => {
            fixture = TestBed.createComponent(HostComponent);
            host = fixture.componentInstance;
            host.dir.set("rtl");
            await settle();
            await resizeTo(400);
            expect(visibleTexts()).toEqual(["Home", "", "Explorer", "Current folder"]);
            for (const chevron of queryAll("li[aria-hidden='true']:not([hidden]) svg")) {
                expect(chevron.classList).toContain("rtl:rotate-180");
            }
        });

        it("keeps folded items out of the accessibility tree and passes axe", async () => {
            await setup({ width: 400 });
            const folded = queryAll<HTMLElement>("li[data-item-index][hidden]");
            expect(folded.map(item => item.textContent?.trim())).toEqual(["Documents", "Projects", "Mona"]);
            expect(folded.every(item => item.style.display === "none")).toBe(true);
            expect((await axe.run(fixture.nativeElement)).violations).toEqual([]);
        });
    });

    describe("with maxItems", () => {
        it("folds to maxItems in a trail that fits", async () => {
            await setup({ maxItems: 3 });
            expect(visibleTexts()).toEqual(["Home", "", "Explorer", "Current folder"]);
        });

        it("folds more than maxItems asks when the width needs it", async () => {
            await setup({ maxItems: 5, width: 300 });
            expect(visibleTexts()).toEqual(["Home", "", "Current folder"]);
        });
    });

    describe("the collapse button", () => {
        it("shows the whole trail and moves focus to the first item it revealed", async () => {
            await setup({ width: 400 });
            const button = expandButton()!;
            button.focus();
            button.click();
            await settle();
            expect(visibleTexts()).toEqual(TRAIL);
            expect(expandButton()).toBeNull();
            expect(document.activeElement).toBe(itemButton("Documents"));
        });

        it("keeps the trail whole as it resizes, until the items change", async () => {
            await setup({ width: 400 });
            expandButton()!.click();
            await settle();
            await resizeTo(200);
            expect(visibleTexts()).toEqual(TRAIL);

            host.crumbs.set(TRAIL.slice(0, 5));
            await settle();
            expect(visibleTexts()).toEqual(["Home", "", "Explorer"]);
        });
    });

    describe("focus", () => {
        it("moves from an item that folds to the button that stands for it", async () => {
            await setup();
            itemButton("Mona").focus();
            await resizeTo(400);
            expect(document.activeElement).toBe(expandButton());
        });

        it("stays on an item that doesn't fold", async () => {
            await setup();
            itemButton("Explorer").focus();
            await resizeTo(400);
            expect(document.activeElement).toBe(itemButton("Explorer"));
        });

        it("moves from the button to the first item it gave back, once everything fits", async () => {
            await setup({ width: 400 });
            expandButton()!.focus();
            await resizeTo(1000);
            expect(expandButton()).toBeNull();
            expect(document.activeElement).toBe(itemButton("Documents"));
        });

        it("stays on the button while something is still folded", async () => {
            await setup({ width: 300 });
            expandButton()!.focus();
            await resizeTo(400);
            expect(document.activeElement).toBe(expandButton());
        });
    });
});
